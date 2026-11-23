const RolesUI = (() => {
  function ruta(nombre) {
    return window.location.pathname.split("/").includes("Paginas")
      ? nombre
      : `Paginas/${nombre}`;
  }

  function escapar(texto) {
    const nodo = document.createElement("div");
    nodo.textContent = texto == null ? "" : texto;
    return nodo.innerHTML;
  }

  async function iniciarUsuarios() {
    const tabla = document.getElementById("lista-usuarios");
    if (!tabla) return;
    const usuario = await Datos.exigirSesion();
    if (!usuario || usuario.rol !== "administrador") {
      window.location.href = ruta("panel.html");
      return;
    }

    async function pintar() {
      const lista = await Datos.usuarios();
      tabla.innerHTML = lista.map((item) => `
        <tr>
          <td>${escapar(item.nombre)}</td>
          <td>${escapar(item.correo)}</td>
          <td>
            <select class="selector-rol" data-id="${item.id}" ${item.id === usuario.id ? "disabled" : ""}>
              ${["administrador", "almacenista", "repartidor"].map((rol) =>
                `<option value="${rol}" ${rol === item.rol ? "selected" : ""}>${rol}</option>`).join("")}
            </select>
          </td>
          <td class="sub">${escapar(item.creado_en)}</td>
          <td>
            ${item.id !== usuario.id
              ? `<button class="btn btn-mini btn-peligro btn-borrar-usuario" data-id="${item.id}" data-nombre="${escapar(item.nombre)}">Eliminar</button>`
              : `<span class="sub">—</span>`}
          </td>
        </tr>`).join("");
    }

    await pintar();
    tabla.addEventListener("change", async (evento) => {
      const selector = evento.target.closest(".selector-rol");
      if (!selector) return;
      try {
        await Datos.cambiarRol(Number(selector.dataset.id), selector.value);
      } catch (error) {
        alert(error.message);
        await pintar();
      }
    });

    tabla.addEventListener("click", async (evento) => {
      const btn = evento.target.closest(".btn-borrar-usuario");
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const nombre = btn.dataset.nombre || "este usuario";
      if (!confirm(`¿Estás seguro de eliminar al usuario "${nombre}"?`)) return;
      try {
        await Datos.borrarUsuario(id);
        const aviso = document.getElementById("aviso");
        if (aviso) {
          aviso.textContent = "Usuario eliminado correctamente.";
          aviso.className = "aviso visible ok";
          setTimeout(() => { aviso.className = "aviso"; }, 3200);
        }
        await pintar();
      } catch (error) {
        alert(error.message);
      }
    });

    document.getElementById("form-usuario").addEventListener("submit", async (evento) => {
      evento.preventDefault();
      const datos = Object.fromEntries(new FormData(evento.target).entries());
      try {
        await Datos.crearUsuario(datos);
        evento.target.reset();
        await pintar();
      } catch (error) {
        alert(error.message);
      }
    });
  }

  async function iniciarEntregas() {
    const lista = document.getElementById("lista-entregas");
    if (!lista) return;
    const usuario = await Datos.exigirSesion();
    if (!usuario) return;
    if (["repartidor", "administrador", "almacenista"].includes(usuario.rol)) {
      const formulario = document.getElementById("form-entrega");
      const selectRepartidor = document.getElementById("ent-repartidor");
      const selectEdificio = document.getElementById("ent-edificio");
      const puedeCrear = usuario && usuario.rol !== "repartidor";

      let listaRepartidores = [];
      if (puedeCrear) {
        const [edificios, repartidores] = await Promise.all([
          Datos.edificiosDe(),
          Datos.repartidores(),
        ]);
        listaRepartidores = repartidores;
        selectEdificio.innerHTML = edificios.map((edificio) =>
          `<option value="${edificio.id}">${escapar(edificio.nombre)}</option>`).join("");
        selectRepartidor.innerHTML = `<option value="">Sin asignar</option>` +
          repartidores.map((repartidor) =>
            `<option value="${repartidor.id}">${escapar(repartidor.nombre)}</option>`).join("");
      } else {
        document.getElementById("crear-entrega").hidden = true;
      }

      async function pintar() {
        const [entregas, repartidores] = await Promise.all([
          Datos.entregas(),
          puedeCrear ? Datos.repartidores() : Promise.resolve([]),
        ]);
        if (puedeCrear) {
          listaRepartidores = repartidores;
        }
        lista.innerHTML = entregas.map((entrega) => `
          <article class="tarjeta entrega">
            <div class="tarjeta-tope">
              <h3>Entrega #${entrega.id} · ${escapar(entrega.destinatario)}</h3>
              <span class="pill">${escapar(entrega.estado.replace("_", " "))}</span>
            </div>
            <p class="sub">${escapar(entrega.edificio_nombre)} · ${escapar(entrega.direccion)}</p>
            <p>${escapar(entrega.detalle) || "Sin detalle"}</p>
            <p class="sub">Repartidor: ${escapar(entrega.repartidor_nombre || "Sin asignar")}</p>
            <div class="entrega-acciones">
              ${usuario.rol !== "repartidor"
                ? `<select class="asignar-repartidor" data-id="${entrega.id}" title="Asignar repartidor">
                    <option value="">Sin asignar</option>
                    ${listaRepartidores.map((r) =>
                      `<option value="${r.id}" ${r.id == entrega.repartidor_id ? "selected" : ""}>${escapar(r.nombre)}</option>`).join("")}
                   </select>`
                : ""}
              <select class="estado-entrega" data-id="${entrega.id}" title="Estado de la entrega">
                ${["pendiente", "en_ruta", "entregada", "cancelada"].map((estado) =>
                  `<option value="${estado}" ${estado === entrega.estado ? "selected" : ""}>${estado.replace("_", " ")}</option>`).join("")}
              </select>
              ${usuario.rol === "administrador" || usuario.rol === "almacenista"
                ? `<button class="btn btn-mini btn-peligro btn-borrar-entrega" data-id="${entrega.id}" data-destinatario="${escapar(entrega.destinatario)}">Eliminar</button>`
                : ""}
            </div>
          </article>`).join("") || '<div class="vacio"><h3>No hay entregas</h3><p>Aún no se han registrado entregas.</p></div>';
      }

      await pintar();

      lista.addEventListener("change", async (evento) => {
        const selectorRep = evento.target.closest(".asignar-repartidor");
        if (selectorRep) {
          try {
            const id = Number(selectorRep.dataset.id);
            const repId = selectorRep.value ? Number(selectorRep.value) : null;
            await Datos.actualizarEntrega(id, null, repId);
            const aviso = document.getElementById("aviso");
            if (aviso) {
              aviso.textContent = "Repartidor asignado correctamente.";
              aviso.className = "aviso visible ok";
              setTimeout(() => { aviso.className = "aviso"; }, 3200);
            }
            await pintar();
          } catch (error) {
            alert(error.message);
            await pintar();
          }
          return;
        }

        const selector = evento.target.closest(".estado-entrega");
        if (!selector) return;
        try {
          await Datos.actualizarEntrega(Number(selector.dataset.id), selector.value);
          await pintar();
        } catch (error) {
          alert(error.message);
        }
      });

      lista.addEventListener("click", async (evento) => {
        const btn = evento.target.closest(".btn-borrar-entrega");
        if (!btn) return;
        const id = Number(btn.dataset.id);
        const destinatario = btn.dataset.destinatario || "";
        if (!confirm(`¿Estás seguro de eliminar la entrega #${id}${destinatario ? ` para "${destinatario}"` : ""}?`)) return;
        try {
          await Datos.borrarEntrega(id);
          const aviso = document.getElementById("aviso");
          if (aviso) {
            aviso.textContent = "Entrega eliminada correctamente.";
            aviso.className = "aviso visible ok";
            setTimeout(() => { aviso.className = "aviso"; }, 3200);
          }
          await pintar();
        } catch (error) {
          alert(error.message);
        }
      });

      if (formulario && puedeCrear) {
        formulario.addEventListener("submit", async (evento) => {
          evento.preventDefault();
          try {
            await Datos.crearEntrega(Object.fromEntries(new FormData(formulario).entries()));
            formulario.reset();
            await pintar();
          } catch (error) {
            alert(error.message);
          }
        });
      }
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      await iniciarUsuarios();
      await iniciarEntregas();
    } catch (error) {
      const aviso = document.getElementById("aviso");
      if (aviso) {
        aviso.textContent = error.message;
        aviso.className = "aviso visible error";
      }
    }
  });
})();
