import axios from "axios";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function IpFinder() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState(null);
  const mapRef = useRef(null);
  const [ipData, setIpData] = useState([
    { label: "Your IP", value: "Loading..." },
    { label: "Location", value: "-" },
    { label: "City", value: "-" },
    { label: "TimeZone", value: "-" },
    { label: "ZipCode", value: "-" },
    { label: "ISP", value: "-" },
  ]);

  const fetchAddress = async () => {
    try {
      setLoading(true);

      const data = await axios.get("https://ipwho.is");

      // --- FIX STARTS HERE ---
      // Moved setCoords OUT of the setIpData array
      setCoords({
        lat: data.data.latitude,
        lng: data.data.longitude,
      });

      setIpData([
        { label: "Your IP", value: data.data.ip },
        {
          label: "Location",
          value: `${data.data.latitude}, ${data.data.longitude}`,
        },
        {
          label: "City",
          value: `${data.data.city} (${data.data.country_code})`,
        },
        { label: "TimeZone", value: data.data.timezone.id },
        { label: "ZipCode", value: data.data.postal || "N/A" },
        { label: "ISP", value: data.data.connection.isp || "N/A" },
      ]);
      

      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch IP data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddress();
  }, []);

  useEffect(() => {
    if (coords && document.getElementById("map")) {
      if (mapRef.current) {
        mapRef.current.setView([coords.lat, coords.lng], 13);

        mapRef.current.eachLayer((layer) => {
          if (layer instanceof L.Marker) {
            mapRef.current.removeLayer(layer);
          }
        });

        L.marker([coords.lat, coords.lng])
          .addTo(mapRef.current)
          .bindPopup("You are here (approx)")
          .openPopup();
      } else {
        mapRef.current = L.map("map").setView([coords.lat, coords.lng], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current);

        L.marker([coords.lat, coords.lng])
          .addTo(mapRef.current)
          .bindPopup("You are here (approx)")
          .openPopup();
      }
    }

    return () => {};
  }, [coords]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-gray-300 w-full max-w-4xl border border-gray-400 min-h-[500px] rounded-md shadow-[2px_2px_1px_1px] shadow-amber-900 overflow-hidden">
        <h1 className="capitalize font-rubik text-center text-xl mt-5 font-semibold text-gray-800">
          IP Finder React
        </h1>

        {error && (
          <p className="text-center text-red-600 mt-2 font-inter">{error}</p>
        )}

        <div className="flex flex-col md:flex-row gap-8 justify-center items-center p-4">
          <div className="w-full md:w-1/2 flex flex-col justify-center space-y-3">
            {ipData.map((item, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex justify-center items-center">

                <span className="bg-gray-200 px-2 py-1 rounded-t-lg border border-black text-sm font-pangolin font-medium w-25 text-center tracking-widest ">
                  {item.label}
                </span>
                </div>
                <div className="font-inter font-normal bg-lime-600 flex items-center px-3 py-2 border border-black rounded-lg  text-white tracking-widest shadow-sm">
                  {loading ? (
                    <span className="animate-pulse">Fetching...</span>
                  ) : (
                    item.value
                  )}
                </div>
              </div>
            ))}
          </div>

          <div
            id="map"
            className="border-2 border-gray-400 h-80 w-full md:w-80 rounded-xl overflow-hidden z-0"
          ></div>
        </div>
      </div>
    </div>
  );
}