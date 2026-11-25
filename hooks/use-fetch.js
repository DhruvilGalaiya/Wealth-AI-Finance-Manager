import { useCallback, useState } from "react";
import { toast } from "sonner";

// Wraps a server action. Treats both thrown errors and `{ success: false }`
// results as failures so callers only see `data` on success.
const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fn = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const response = await cb(...args);
        if (response && response.success === false) {
          throw new Error(response.error || "Something went wrong");
        }
        setData(response);
        return response;
      } catch (err) {
        setError(err);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    },
    [cb]
  );

  return { data, loading, error, fn, setData };
};

export default useFetch;
