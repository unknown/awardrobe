import { RefObject } from "react";

interface PricesFormProps {
  onFilter(): void;
  styleRef: RefObject<HTMLInputElement>;
  sizeRef: RefObject<HTMLInputElement>;
}

export function PricesForm({
  onFilter,
  styleRef,
  sizeRef,
  children,
}: React.PropsWithChildren<PricesFormProps>) {
  return (
    <div>
      <p className="mb-1 font-bold">Filters:</p>
      <form className="mb-4 flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-2">
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
            onFilter();
          }}
        >
          Apply Filters
        </button>
      </form>
      {children}
    </div>
  );
}
