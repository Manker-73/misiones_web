// Mensaje de error de un campo.
// role="alert" hace que el lector de pantalla lo anuncie en cuanto aparece,
// y el id permite enlazarlo al campo con aria-describedby.
function MensajeError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="error" role="alert">
      {children}
    </p>
  );
}

export default MensajeError;
