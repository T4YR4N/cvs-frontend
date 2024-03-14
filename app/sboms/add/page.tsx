"use client";

import { useState } from "react";
import styles from "./sbomsAdd.module.css";
import apiFetch from "@/common/api/apiFetch";

type InputData = {
  prettyName: string;
  value: any;
};

const View: React.FC = () => {
  const [sboms, setSboms] = useState<InputData>({
    prettyName: "",
    value: undefined,
  });
  const [error, setError] = useState<string | undefined>(undefined);

  const save = async () => {
    const postSbomsRes = await apiFetch("sboms", {
      method: "POST",
      body: JSON.stringify(sboms),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!postSbomsRes.success) {
      setError(postSbomsRes.message);
      return;
    }
    setSboms({ prettyName: "", value: undefined });
  };

  return (
    <div>
      <h1>SBOMs</h1>
      <p>Software Bill of Materials</p>
      <div className={styles.addContainer}>
        <input
          type="text"
          placeholder="prettyName"
          value={sboms.prettyName}
          onChange={(e) => setSboms({ ...sboms, prettyName: e.target.value })}
        />
        <textarea
          placeholder="sbom"
          value={sboms.value ? JSON.stringify(sboms.value) : ""}
          onChange={(e) =>
            setSboms({ ...sboms, value: JSON.parse(e.target.value) })
          }
        />
        <button onClick={save}>Hinzufügen</button>
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
};

export default View;
