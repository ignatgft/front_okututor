/* eslint-disable react-refresh/only-export-components */
// migrated to TSX — minimal strict types (controlled)
import { useState } from "react";
import { useTranslation } from "react-i18next";

const LOCATION_OPTS = ["tutor", "student", "center", "other"];

/**
 * Location picker for OFFLINE lessons (spec §6 / audit §2.2).
 * Lets the user choose the venue type + address + details.
 */
export function LocationPicker({ value, onChange }) {
  const { t } = useTranslation();
  const [spot, setSpot] = useState(value?.spot || "");
  const [address, setAddress] = useState(value?.address || "");
  const [details, setDetails] = useState(value?.details || "");

  const emit = (patch) => {
    onChange?.({ spot, address, details, ...patch });
  };

  const selectSpot = (s) => {
    setSpot(s);
    emit({ spot: s });
  };

  return (
    <div className="location-picker">
      <fieldset className="location-group">
        <legend>{t("location.place", "Place")}</legend>
        <div className="location-options">
          {LOCATION_OPTS.map((op) => (
            <label key={op} className="location-option">
              <input
                type="radio"
                name="location-spot"
                checked={spot === op}
                onChange={() => selectSpot(op)}
              />
              <span>{t(`location.${op}`, op)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-field">
        <label htmlFor="location-address">{t("location.address", "Address")}</label>
        <input
          id="location-address"
          type="text"
          value={address}
          placeholder="г. Бишкек, ул. Киевская 120"
          onChange={(e) => {
            setAddress(e.target.value);
            emit({ address: e.target.value });
          }}
        />
      </div>

      <div className="form-field">
        <label htmlFor="location-details">{t("location.details", "Details")}</label>
        <input
          id="location-details"
          type="text"
          value={details}
          placeholder={t("location.details_placeholder", "e.g. Office 305, floor 3")}
          onChange={(e) => {
            setDetails(e.target.value);
            emit({ details: e.target.value });
          }}
        />
      </div>
    </div>
  );
}

export function isValidLocation(value) {
  if (!value) return false;
  if (!value.spot) return false;
  if (!value.address || !value.address.trim()) return false;
  return true;
}
