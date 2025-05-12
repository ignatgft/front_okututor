import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PgAuditorium.css";
import axios from "axios";

const PgAuditorium = () => {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const createMeeting = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const start_time = new Date(now.getTime() + 5 * 60000).toISOString();

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/create-meeting/`,
        {
          topic: "Okututor Meeting",
          start_time,
          duration: 30,
        }
      );

      setMeetingUrl(response.data.join_url);
    } catch (error) {
      console.error("Ошибка при создании встречи:", error);
      alert("Не удалось создать встречу.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = () => {
    if (joinUrl) {
      window.open(joinUrl, "_blank");
    } else {
      alert("Введите ссылку для подключения.");
    }
  };

  return (
    <div className="auditorium-container">
      <button className="back-button" onClick={() => navigate("/")}>⬅ На главную</button>

      <h2 className="auditorium-title">Zoom Аудитория</h2>

      <div className="card">
        <h3>Создать Zoom встречу</h3>
        <button onClick={createMeeting} className="green-btn" disabled={isLoading}>
          {isLoading ? "Создание..." : "Создать встречу"}
        </button>
        {meetingUrl && (
          <div className="meeting-link">
            <p>Ссылка для подключения:</p>
            <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
              {meetingUrl}
            </a>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Присоединиться к встрече</h3>
        <input
          type="text"
          className="input-field"
          placeholder="Вставьте Zoom ссылку..."
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
        />
        <button className="green-btn" onClick={handleJoin}>
          Присоединиться
        </button>
      </div>
    </div>
  );
};

export default PgAuditorium;
