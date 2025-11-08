import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [predictions, setPredictions] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    Population: "",
    No_of_Bins: "",
    Avg_Temp: "",
    Rainfall: "",
    Waste_Collected: ""
  });
  const [message, setMessage] = useState("");

  // Base backend URL
  const backendURL = "http://localhost:4321/api/user";

  // Fetch predictions
  const fetchPredictions = async () => {
    try {
      const res = await axios.get(`${backendURL}/predictallwards`);
      setPredictions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit form to add/update ward
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${backendURL}/add-update-ward`, formData);
      setMessage(res.data.message);
      setFormData({
        name: "",
        Population: "",
        No_of_Bins: "",
        Avg_Temp: "",
        Rainfall: "",
        Waste_Collected: ""
      });
      fetchPredictions(); // refresh predictions
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || "Error");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Waste Collection Prediction per Ward</h1>

      <h2>Predictions</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Ward</th>
            <th>Predicted Waste (kg)</th>
          </tr>
        </thead>
        <tbody>
          {predictions.map((p, i) => (
            <tr key={i}>
              <td>{p.ward}</td>
              <td>{p.predicted_waste_kg}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "30px" }}>Add / Update Ward</h2>
      <form onSubmit={handleSubmit}>
        {["name", "Population", "No_of_Bins", "Avg_Temp", "Rainfall", "Waste_Collected"].map((field) => (
          <div key={field} style={{ marginBottom: "10px" }}>
            <label style={{ width: "150px", display: "inline-block" }}>{field}: </label>
            <input
              name={field}
              value={formData[field]}
              onChange={handleChange}
              required
            />
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>

      {message && <p style={{ marginTop: "20px", color: "green" }}>{message}</p>}
    </div>
  );
}

export default App;
