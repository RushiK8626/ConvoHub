import React, { useState } from "react";
import { Languages, Loader, X } from "lucide-react";
import { translateText, detectLanguage } from "../utils/aiClient";
import "./MessageTranslator.css";

const LANGUAGES = [
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

const MessageTranslator = ({ messageText, onClose }) => {
  const [translatedText, setTranslatedText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("es");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [showLanguageList, setShowLanguageList] = useState(false);

  const handleTranslate = async (targetLang) => {
    setLoading(true);
    setError(null);

    try {
      // Detect source language first
      const detection = await detectLanguage(messageText);
      setDetectedLanguage(detection.languageCode);

      // Then translate
      const result = await translateText(messageText, targetLang);
      setTranslatedText(result.translatedText || result.translated_text || "");
      setSelectedLanguage(targetLang);
      setShowLanguageList(false);
    } catch (err) {
      console.error("Translation error:", err);
      setError("Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getLanguageName = (code) => {
    const lang = LANGUAGES.find((l) => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
  };

  return (
    <div className="message-translator-overlay" onClick={onClose}>
      <div
        className="message-translator-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="translator-header">
          <div className="translator-title">
            <Languages size={20} />
            <span>Translate Message</span>
          </div>
          <button className="translator-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="translator-content">
          {/* Original Text */}
          <div className="translator-section">
            <div className="translator-section-label">
              Original{" "}
              {detectedLanguage && `(${getLanguageName(detectedLanguage)})`}
            </div>
            <div className="translator-text-box original">{messageText}</div>
          </div>

          {/* Language Selector */}
          <div className="translator-language-selector">
            <button
              className="language-selector-btn"
              onClick={() => setShowLanguageList(!showLanguageList)}
              disabled={loading}
            >
              <span>Translate to: {getLanguageName(selectedLanguage)}</span>
              <span
                className={`dropdown-arrow ${showLanguageList ? "open" : ""}`}
              >
                ▼
              </span>
            </button>

            {showLanguageList && (
              <div className="language-list">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-option ${
                      selectedLanguage === lang.code ? "selected" : ""
                    }`}
                    onClick={() => handleTranslate(lang.code)}
                  >
                    <span className="language-flag">{lang.flag}</span>
                    <span className="language-name">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Translated Text */}
          {loading && (
            <div className="translator-loading">
              <Loader size={24} className="spinning" />
              <span>Translating...</span>
            </div>
          )}

          {error && <div className="translator-error">{error}</div>}

          {!loading && !error && translatedText && (
            <div className="translator-section">
              <div className="translator-section-label">
                Translation ({getLanguageName(selectedLanguage)})
              </div>
              <div className="translator-text-box translated">
                {translatedText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageTranslator;
