import { useMemo, useState } from "react";
import Papa from "papaparse";
import "./App.css";

function App() {
  // Datos y estado de la consulta de movimientos.
  const [registros, setRegistros] = useState([]);
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [consultaRealizada, setConsultaRealizada] = useState(false);

  // Estado temporal del acceso demostrativo.
  const [sesionIniciada, setSesionIniciada] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errorLogin, setErrorLogin] = useState("");

  // Valida que el formulario demo tenga datos antes de mostrar el panel.
  function iniciarSesion(event) {
    event.preventDefault();

    if (!usuario.trim() || !contrasena.trim()) {
      setErrorLogin("Ingresa tu usuario y contraseña para continuar.");
      return;
    }

    setErrorLogin("");
    setSesionIniciada(true);
  }

  // Consulta los movimientos en la API y reemplaza cualquier CSV cargado.
  async function consultarBaseDatos() {
    setCargando(true);
    setError("");
    setConsultaRealizada(true);

    try {
      const respuesta = await fetch(
        `/api/movimientos?cuenta=${encodeURIComponent(numeroCuenta.trim())}`
      );
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error ?? "No se pudo consultar la base de datos.");
      }

      setRegistros(datos);
      setNombreArchivo("");
    } catch (problema) {
      setRegistros([]);
      setError(problema.message);
    } finally {
      setCargando(false);
    }
  }

  // Lee un CSV local, valida sus columnas y conserva solo filas utilizables.
  function cargarCSV(event) {
    const archivo = event.target.files?.[0];

    setRegistros([]);
    setNumeroCuenta("");
    setNombreArchivo("");
    setError("");
    setConsultaRealizada(false);

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

        // Se conserva la cuenta como texto para no perder ceros iniciales.
        const filasValidas = data
          .map((fila) => ({
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

  // Filtra en memoria los resultados del CSV según la cuenta escrita.
  const resultados = useMemo(() => {
    const busqueda = numeroCuenta.trim().toLowerCase();

    if (!busqueda) {
      return registros;
    }

    return registros.filter((registro) =>
      registro.cuenta.toLowerCase().includes(busqueda)
    );
  }, [registros, numeroCuenta]);

  // Calcula el total que se muestra en el resumen.
  const totalMonto = resultados.reduce(
    (total, registro) => total + registro.monto,
    0
  );

  // Formatea los montos con la moneda usada por la interfaz.
  const formatoMoneda = new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
  });

  // Vista de acceso temporal mientras no exista autenticación real.
  if (!sesionIniciada) {
    return (
      <main className="login-contenedor">
        <section className="login-presentacion">
          <p className="etiqueta">Sistema financiero</p>
          <h1>Todo movimiento, bajo control.</h1>
          <p>
            Consulta información de cuentas desde un espacio claro y privado
            para tu equipo.
          </p>
          <span className="login-linea" />
          <small>Consulta de movimientos · Acceso interno</small>
        </section>

        <section className="login-panel">
          <div className="login-marca">
            <span className="marca-icono">S</span>
            <span>Consulta</span>
          </div>

          <div className="login-titulo">
            <p className="sobretitulo">Bienvenido</p>
            <h2>Inicia sesión</h2>
            <p>Ingresa tus datos para acceder al panel.</p>
          </div>

          <form className="login-formulario" onSubmit={iniciarSesion}>
            <label htmlFor="usuario">Usuario o correo</label>
            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              placeholder="nombre@empresa.com"
              autoComplete="username"
            />

            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={(event) => setContrasena(event.target.value)}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
            />

            {errorLogin && <p className="error-login">{errorLogin}</p>}

            <button className="boton-login" type="submit">
              Entrar al panel <span aria-hidden="true">-&gt;</span>
            </button>
          </form>

          <p className="aviso-demo">
            Modo demostración: no se validan ni almacenan credenciales reales.
          </p>
        </section>
      </main>
    );
  }

  // Vista principal para consultar movimientos.
  return (
    <main className="contenedor">
      <section className="encabezado">
        <div className="encabezado-meta">
          <p className="etiqueta">Consulta de movimientos</p>
          <span className="estado">Panel operativo</span>
        </div>
        <h1>Buscar información por cuenta</h1>
        <p>
          Consulta los movimientos almacenados en MySQL o carga un CSV local.
        </p>
      </section>

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

        <button
          className="boton-principal"
          type="button"
          onClick={consultarBaseDatos}
          disabled={cargando}
        >
          {cargando ? "Consultando..." : "Consultar base de datos"}
        </button>
      </section>

      <section className="panel">
        <label className="titulo-campo" htmlFor="archivo">
          O cargar un archivo CSV
        </label>

        <input
          id="archivo"
          className="selector-archivo"
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

      {consultaRealizada && registros.length === 0 && !error && (
        <section className="estado-vacio">
          <strong>No encontramos movimientos</strong>
          <span>Prueba con otra cuenta o revisa los datos cargados.</span>
        </section>
      )}

      {registros.length > 0 && (
        <>
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
            <div className="seccion-titulo">
              <div>
                <p className="sobretitulo">Detalle de consulta</p>
                <h2>Resultados</h2>
              </div>
              <span className="contador">{resultados.length} filas</span>
            </div>

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