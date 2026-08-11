import { CaretLeft } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  backTo: string;
  backLabel: string;
}

export function PageHeader({ title, backTo, backLabel }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="page-header">
      <button
        className="page-back"
        type="button"
        aria-label={backLabel}
        onClick={() => navigate(backTo)}
      >
        <CaretLeft size={25} weight="bold" aria-hidden="true" />
      </button>
      <h1>{title}</h1>
      <span className="page-header-spacer" aria-hidden="true" />
    </header>
  );
}
