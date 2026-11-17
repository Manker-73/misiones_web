import FormularioInscripcion from "./components/FormularioInscripcion";

function App() {
  return (
    <main className="contenedor">
      <header>
        <h1>Open de Speedcubing</h1>
        <p>Inscríbete en el torneo y consulta la lista de participantes.</p>
      </header>

      <FormularioInscripcion />
    </main>
  );
}

export default App;
