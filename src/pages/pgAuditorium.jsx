import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/PgAuditorium.css";
import axios from "axios";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { FaCopy } from "react-icons/fa"; // Иконка копирования

const PgAuditorium = () => {
  const [meetingUrl, setMeetingUrl] = useState("");
  const [joinUrl, setJoinUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [hasCourses, setHasCourses] = useState(false);
  const [copySuccess, setCopySuccess] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Проверяем авторизацию пользователя и наличие курсов
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Запрашиваем курсы пользователя
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/courses/${currentUser.uid}`
          );
          const courses = response.data;
          // Проверяем, есть ли у пользователя курсы (и нет ли ошибки в ответе)
          setHasCourses(Array.isArray(courses) && courses.length > 0 && !courses[0]?.error);
        } catch (error) {
          console.error("Ошибка при получении курсов:", error);
          setHasCourses(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
      alert(t("auditorium.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = () => {
    if (joinUrl) {
      window.open(joinUrl, "_blank");
    } else {
      alert(t("auditorium.join_input_placeholder"));
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(meetingUrl).then(
      () => {
        setCopySuccess(t("auditorium.copy_success"));
        setTimeout(() => setCopySuccess(""), 2000);
      },
      (err) => {
        console.error("Ошибка при копировании:", err);
        setCopySuccess(t("auditorium.copy_error"));
      }
    );
  };

  return (
    <div className="auditorium-container">
      <button className="back-button" onClick={() => navigate("/")}>
        {t("buttons.back_home")}
      </button>

      <h2 className="auditorium-title">{t("auditorium.title")}</h2>

      {user && hasCourses && (
        <div className="card">
          <h3>{t("auditorium.create_title")}</h3>
          <button onClick={createMeeting} className="green-btn" disabled={isLoading}>
            {isLoading ? t("auditorium.creating") : t("auditorium.create_btn")}
          </button>
          {meetingUrl && (
            <div className="meeting-link">
              <p>{t("auditorium.link_label")}</p>
              <div className="link-container">
                <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                  {meetingUrl}
                </a>
                <button className="copy-btn" onClick={copyToClipboard}>
                  <FaCopy />
                </button>
              </div>
              {copySuccess && <p className="copy-message">{copySuccess}</p>}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3>{t("auditorium.join_title")}</h3>
        <input
          type="text"
          className="input-field"
          placeholder={t("auditorium.join_input_placeholder")}
          value={joinUrl}
          onChange={(e) => setJoinUrl(e.target.value)}
        />
        <button className="green-btn" onClick={handleJoin}>
          {t("auditorium.join_btn")}
        </button>
      </div>
    </div>
  );
};

export default PgAuditorium;