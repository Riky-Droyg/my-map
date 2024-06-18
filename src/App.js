import React, { useState, useEffect, useRef } from "react";
import MarkerClusterer from "marker-clusterer-plus";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCV0tzp6tpZnPjjZJlpkg7t7L5tDfyScbs",
  authDomain: "my-map-93787.firebaseapp.com",
  projectId: "my-map-93787",
  storageBucket: "my-map-93787.appspot.com",
  messagingSenderId: "1019716733017",
  appId: "1:1019716733017:web:e7db3bfa146cdd681dc948",
  measurementId: "G-CJH5KV0PCM"
};

firebase.initializeApp(firebaseConfig);

const GoogleMap = () => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const markerCountRef = useRef(0);
  let markerCluster;

  useEffect(() => {
    const loadGoogleMaps = () => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=$AIzaSyBEGBs39UiY2Qljl5ImE3rJAGcu_o-S0MQ&callback=initMap`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    };

    if (!window.google || !window.google.maps) {
      loadGoogleMaps();
    } else {
      initMap();
    }

    return () => {
      const script = document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js"]');
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const initMap = () => {
    const initialLat = 49.8397;
    const initialLng = 24.0297;
    const location = { lat: initialLat, lng: initialLng };
    const newMap = new window.google.maps.Map(document.getElementById("map"), {
      zoom: 12,
      center: location,
    });
    setMap(newMap);

    markerCluster = new MarkerClusterer(newMap, [], {
      imagePath:
        "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
    });

    newMap.addListener("click", (event) => {
      addMarker(event.latLng.lat(), event.latLng.lng());
    });

    addMarker(initialLat, initialLng, true);
  };

  const addMarker = (lat, lng, isFirstMarker) => {
    const label = isFirstMarker ? "0" : (++markerCountRef.current).toString();
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      label: label,
      draggable: true,
    });

    setMarkers([...markers, marker]);
    markerCluster.addMarker(marker);

    addFirebaseRecord(lat, lng);
  };

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

  const removeLastMarker = () => {
    if (markers.length > 0) {
      const lastMarker = markers[markers.length - 1];
      lastMarker.setMap(null);
      setMarkers(markers.slice(0, -1));
      markerCountRef.current--;
    }
  };

  const removeAllMarkers = () => {
    markers.forEach((marker) => marker.setMap(null));
    setMarkers([]);
    markerCountRef.current = 0;
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
