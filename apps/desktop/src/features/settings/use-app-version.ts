import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";

export const useAppVersion = () => {
  const [version, setVersion] = useState("");

  useEffect(() => {
    let active = true;
    void getVersion().then((value) => {
      if (active) setVersion(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return version;
};
