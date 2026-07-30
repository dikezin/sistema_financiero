import { useMemo, useState } from "react";
import Papa from "papaparse";
import "./App.css";

function App() {
  const [registros, setRegistros] = useState([]);
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [error, setError] = useState("");

  function cargarCSV(event) {
    const archivo = event.target.files?.[0];

    setRegistros([]);
    setNumeroCuenta("");
    setNombreArchivo("");
    setError("");

    if (!archivo) return;

    if (!archivo.name.toLowerCase().endsWith(".csv")) {
      setError("Debes seleccionar un archivo CSV.");
      return;
    }

    Papa.parse(archivo, {
      header: true,
      skipEmptyLines: true,

      transformHeader: (encabezado) =>
        encabezado.trim().toLowerCase(),

      complete: ({ data, errors, meta }) => {
        if (errors.length > 0) {
          setError(`No se pudo leer el archivo: ${errors[0].message}`);
          return;
        }

        const columnasRequeridas = ["cuenta", "monto", "fecha"];
        const columnas = meta.fields ?? [];

        const faltantes = columnasRequeridas.filter(
          (columna) => !columnas.includes(columna)
        );

        if (faltantes.length > 0) {
          setError(
            `Faltan estas columnas en el CSV: ${faltantes.join(", ")}`
          );
          return;
        }

        const filasValidas = data
          .map((fila) => ({
            // Se conserva como texto para no perder ceros iniciales.
            cuenta: String(fila.cuenta ?? "").trim(),
            monto: Number(
              String(fila.monto ?? "")
                .trim()
                .replace(",", ".")
            ),
            fecha: String(fila.fecha ?? "").trim(),
          }))
          .filter(
            (fila) =>
              fila.cuenta !== "" &&
              fila.fecha !== "" &&
              Number.isFinite(fila.monto)
          );

        if (filasValidas.length === 0) {
          setError("El archivo no contiene registros válidos.");
          return;
        }

        setRegistros(filasValidas);
        setNombreArchivo(archivo.name);
      },

      error: (problema) => {
        setError(`No se pudo abrir el archivo: ${problema.message}`);
      },
    });
  }

  const resultados = useMemo(() => {
    const busqueda = numeroCuenta.trim().toLowerCase();

    if (!busqueda) {
      return registros;
    }

    return registros.filter((registro) =>
      registro.cuenta.toLowerCase().includes(busqueda)
    );
  }, [registros, numeroCuenta]);

  const totalMonto = resultados.reduce(
    (total, registro) => total + registro.monto,
    0
  );

  const formatoMoneda = new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  });

  return (
    <main className="contenedor">
      <section className="encabezado">
        <p className="etiqueta">Consulta de movimientos</p>
        <h1>Buscar información por cuenta</h1>
        <p>
          Sube un archivo CSV con las columnas cuenta, monto y fecha.
        </p>
      </section>

      <section className="panel">
        <label className="titulo-campo" htmlFor="archivo">
          Archivo CSV
        </label>

        <input
          id="archivo"
          type="file"
          accept=".csv,text/csv"
          onChange={cargarCSV}
        />

        {nombreArchivo && (
          <p className="archivo">
            Archivo cargado: <strong>{nombreArchivo}</strong>
          </p>
        )}
      </section>

      {error && <p className="error">{error}</p>}

      {registros.length > 0 && (
        <>
          <section className="panel">
            <label className="titulo-campo" htmlFor="cuenta">
              Número de cuenta
            </label>

            <input
              id="cuenta"
              className="buscador"
              type="text"
              value={numeroCuenta}
              onChange={(event) => setNumeroCuenta(event.target.value)}
              placeholder="Ejemplo: 0012345678"
              autoComplete="off"
            />
          </section>

          <section className="resumen">
            <article>
              <span>Registros encontrados</span>
              <strong>{resultados.length}</strong>
            </article>

            <article>
              <span>Monto total</span>
              <strong>{formatoMoneda.format(totalMonto)}</strong>
            </article>
          </section>

          <section className="panel">
            <h2>Resultados</h2>

            {resultados.length === 0 ? (
              <p>No existen registros para esa cuenta.</p>
            ) : (
              <div className="tabla-contenedor">
                <table>
                  <thead>
                    <tr>
                      <th>Cuenta</th>
                      <th>Monto</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {resultados.map((registro, indice) => (
                      <tr
                        key={`${registro.cuenta}-${registro.fecha}-${indice}`}
                      >
                        <td>{registro.cuenta}</td>
                        <td>{formatoMoneda.format(registro.monto)}</td>
                        <td>{registro.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default App;