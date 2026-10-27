export interface OpcionSelect {
   valor: string;
   etiqueta: string;
}

interface Props {
  id: string;
  etiqueta: string;
  valor: string;
  opciones: readonly OpcionSelect[];
  onChange: (nuevoValor: string) => void;
}

export function CampoSelect({ id, etiqueta, valor, opciones, onChange }: Props) {
  return (
    <div className="control-group">
      <label htmlFor={id}>
        <strong>{etiqueta}</strong>
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      >
        {opciones.map((op) => (
          <option key={op.valor} value={op.valor}>
            {op.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}