import { useEffect } from "react";
import { socket } from "../services/socket";

export function useSocket<T>(event: string, callback: (data: T) => void) {
  useEffect(() => {
    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  }, [event, callback]);
}
