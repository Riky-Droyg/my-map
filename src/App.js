import React, { useState, useEffect, useRef } from "react";
import MarkerClusterer from "marker-clusterer-plus";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// Конфігурація Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCV0tzp6tpZnPjjZJlpkg7t7L5tDfyScbs",
  authDomain: "my-map-93787.firebaseapp.com",
  projectId: "my-map-93787",
  storageBucket: "my-map-93787.appspot.com",
  messagingSenderId: "1019716733017",
  appId: "1:1019716733017:web:e7db3bfa146cdd681dc948",
  measurementId: "G-CJH5KV0PCM"
};

// Ініціалізація Firebase
firebase.initializeApp(firebaseConfig);

const GoogleMap = () => {
  const [map, setMap] = useState(null); // Стан для зберігання карти
  const [markers, setMarkers] = useState([]); // Стан для зберігання маркерів
  const markerCountRef = useRef(0); // Реф для зберігання кількості маркерів
  const markerClusterRef = useRef(null); // Реф для зберігання кластеру маркерів

  // Виконання коду при першому завантаженні компонента
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Додавання скрипту Google Maps API
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBEGBs39UiY2Qljl5ImE3rJAGcu_o-S0MQ&callback=initMap`;
      script.async = true;
      script.defer = true;
      script.onload = initMap; // Виклик функції initMap після завантаження скрипту
      document.head.appendChild(script);
    };

    // Завантаження Google Maps API, якщо він ще не завантажений
    if (!window.google || !window.google.maps) {
      loadGoogleMaps();
    } else {
      initMap();
    }

    // Очищення скрипту при демонтaжі компонента
    return () => {
      const script = document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js"]');
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Ініціалізація карти
  const initMap = () => {
    const initialLat = 49.8397;
    const initialLng = 24.0297;
    const location = { lat: initialLat, lng: initialLng };
    const newMap = new window.google.maps.Map(document.getElementById("map"), {
      zoom: 12,
      center: location,
    });
    setMap(newMap); // Збереження карти у стані

    // Ініціалізація кластеру маркерів
    markerClusterRef.current = new MarkerClusterer(newMap, [], {
      imagePath:
        "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
    });

    // Додавання слухача подій на карту для додавання маркерів по кліку
    newMap.addListener("click", (event) => {
      addMarker(event.latLng.lat(), event.latLng.lng());
    });

    // Додавання початкового маркера
    addMarker(initialLat, initialLng, true);
  };

  // Додавання маркера на карту
  const addMarker = (lat, lng, isFirstMarker = false) => {
    // Встановлення мітки маркера (0 для першого маркера, інкремент для наступних)
    const label = isFirstMarker ? "0" : (++markerCountRef.current).toString();
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      label: label,
      draggable: true, // Маркер можна перетягувати
    });

    // Оновлення стану маркерів та додавання маркера до кластеру
    setMarkers((prevMarkers) => {
      const newMarkers = [...prevMarkers, marker];
      markerClusterRef.current.addMarker(marker);
      return newMarkers;
    });

    // Додавання запису у Firebase
    addFirebaseRecord(lat, lng);
  };

  // Додавання запису про маркер у Firebase
  const addFirebaseRecord = (lat, lng) => {
    const timestamp = firebase.firestore.Timestamp.now();
    const questsRef = firebase.firestore().collection("quests");

    questsRef.add({
      location: new firebase.firestore.GeoPoint(lat, lng),
      timestamp: timestamp,
    }).then((docRef) => {
      console.log("Document written with ID: ", docRef.id);
    }).catch((error) => {
      console.error("Error adding document: ", error);
    });
  };

  // Видалення останнього маркера з карти
  const removeLastMarker = () => {
    setMarkers((prevMarkers) => {
      if (prevMarkers.length === 0) return prevMarkers;

      const lastMarker = prevMarkers[prevMarkers.length - 1];
      lastMarker.setMap(null);
      markerClusterRef.current.removeMarker(lastMarker);

      markerCountRef.current--;
      return prevMarkers.slice(0, -1);
    });
  };

  // Видалення всіх маркерів з карти
  const removeAllMarkers = () => {
    setMarkers((prevMarkers) => {
      prevMarkers.forEach((marker) => {
        marker.setMap(null);
        markerClusterRef.current.removeMarker(marker);
      });
      markerCountRef.current = 0;
      return [];
    });
  };

  return (
    <div>
      <h3>Моя Google Карта</h3>
      <div id="map" style={{ height: "400px", width: "100%" }}></div>
      <button onClick={removeLastMarker}>Видалити останній маркер</button>
      <button onClick={removeAllMarkers}>Видалити всі маркери</button>
    </div>
  );
};

export default GoogleMap;
