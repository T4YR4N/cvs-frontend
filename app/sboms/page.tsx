"use client";

import apiFetch from "@/common/api/apiFetch";
import { useEffect, useState } from "react";
import mainStyles from "@/app/main.module.css";
import { useRouter } from "next/navigation";
import { Sboms } from "@/common/api/types";
import { formatDate } from "@/common/date";

const View: React.FC = () => {
  const [sboms, setSboms] = useState<Sboms>([]);

  useEffect(() => {
    const fetchData = async () => {
      const getSbomsRes = await apiFetch<Sboms>("sboms");

      if (!getSbomsRes.success) return;
      setSboms(getSbomsRes.responseObject);
      console.log(getSbomsRes);
    };
    fetchData();
  }, []);

  const router = useRouter();

  return (
    <div>
      <h1>SBOMs</h1>
      <p>Software Bill of Materials</p>
      <table className={mainStyles.clickableTable}>
        <tbody>
          {sboms.map((sbom) => {
            return (
              <tr
                key={sbom.id}
                onClick={() => router.push(`/scans/${sbom.id}`)}
              >
                <td>{sbom.id}</td>
                <td>{sbom.prettyName}</td>
                <td>{formatDate(sbom.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <a href="/sboms/add">Add</a>
    </div>
  );
};

export default View;
