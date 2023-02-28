import { useRef } from "react";

interface PricesFormProps {
  updatePricesData(style?: string, size?: string): void;
}

export function PricesForm({ updatePricesData }: PricesFormProps) {
  const styleRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);

  return (
    <form className="flex flex-col items-start gap-4 md:flex-row">
      <label>
        Style:{" "}
        <input
          className="rounded-md border border-gray-200 p-2"
          placeholder="08"
          ref={styleRef}
        />
      </label>
      <label>
        Size:{" "}
        <input
          className="rounded-md border border-gray-200 p-2"
          placeholder="028"
          ref={sizeRef}
        />
      </label>
      <button
        className="rounded-md border border-gray-200 py-2 px-4"
        type="submit"
        onClick={(e) => {
          e.preventDefault();
          updatePricesData(styleRef.current?.value, sizeRef.current?.value);
        }}
      >
        Apply Filters
      </button>
    </form>
  );
}
