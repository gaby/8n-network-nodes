# Network Basic Nodes para n8n

Un paquete completo de nodos comunitarios para n8n que proporciona funcionalidades de red TCP y UDP con nodos especializados de cliente y servidor.

**🌐 Idiomas:** [English](README.md) | [Español](README.es.md) | [Galego](README.gl.md)

[![versión npm](https://badge.fury.io/js/n8n-nodes-network-basic-nodes.svg)](https://badge.fury.io/js/n8n-nodes-network-basic-nodes)
[![descargas npm](https://img.shields.io/npm/dm/n8n-nodes-network-basic-nodes.svg)](https://www.npmjs.com/package/n8n-nodes-network-basic-nodes)

## 📦 Instalación

Instala este paquete desde la biblioteca de nodos comunitarios de n8n:

### Opción 1: A través de la interfaz de n8n (Recomendado)

1. Ve a **Configuración** → **Nodos Comunitarios**
2. Haz clic en **Instalar un nodo comunitario**
3. Introduce: `n8n-nodes-network-basic-nodes`
4. Haz clic en **Instalar**

### Opción 2: A través de npm

```bash
npm install n8n-nodes-network-basic-nodes
```

### Opción 3: A través de Docker

Añade esta línea a tu entorno Docker de n8n:

```bash
-e N8N_COMMUNITY_PACKAGES="n8n-nodes-network-basic-nodes"
```

## 🚀 Nodos Incluidos

### Cliente TCP y Cliente UDP

**📤 Envía datos mediante protocolos TCP/UDP**

- **Categoría:** Acciones
- **Iconos:** TCP (📡), UDP (📻)

**Características Principales:**

- Soporte para protocolos TCP y UDP
- Timeouts configurables de conexión y respuesta
- Múltiples codificaciones de texto (UTF-8, ASCII, Base64, Hex)
- Espera de respuesta opcional y persistencia de conexión (TCP)
- Manejo integral de errores y reportes de estado

### Trigger del Servidor TCP y Trigger del Servidor UDP

**🖥️ Escucha conexiones TCP/UDP entrantes**

- **Categoría:** Triggers
- **Iconos:** Servidor TCP (🖥️), Servidor UDP (📡)

**Características Principales:**

- Activación automática de flujos de trabajo al recibir datos
- Vinculación de host configurable (localhost o todas las interfaces)
- Control de límite de conexiones (TCP)
- Respuesta automática opcional a clientes
- Soporte de datos binarios con codificación base64

## 📋 Ejemplos de Uso

### Enviando Datos (Nodos Cliente)

**Cliente TCP:**

```json
{
  "host": "192.168.1.100",
  "port": 8080,
  "message": "¡Hola Servidor TCP!",
  "waitForResponse": true,
  "encoding": "utf8"
}
```

**Cliente UDP:**

```json
{
  "host": "192.168.1.100",
  "port": 9090,
  "message": "¡Hola Servidor UDP!",
  "encoding": "utf8"
}
```

### Recibiendo Datos (Triggers de Servidor)

**Ejemplo de Salida:**

```json
{
  "protocol": "tcp",
  "server": { "host": "127.0.0.1", "port": 8080 },
  "client": { "remoteAddress": "192.168.1.50", "remotePort": 54321 },
  "data": "Mensaje recibido",
  "encoding": "utf8",
  "bytes": 16,
  "timestamp": "2024-12-24T19:30:00.000Z"
}
```

## ⚙️ Configuración Predeterminada

| Configuración            | TCP       | UDP       |
| ------------------------ | --------- | --------- |
| **Puerto**               | 8080      | 9090      |
| **Host**                 | 127.0.0.1 | 127.0.0.1 |
| **Codificación**         | UTF-8     | UTF-8     |
| **Timeout de Conexión**  | 5000ms    | N/A       |
| **Timeout de Respuesta** | 3000ms    | 3000ms    |

## 🎯 Casos de Uso Comunes

### Nodos Cliente (Enviando Datos)

- **Comunicación IoT:** Enviar comandos a dispositivos inteligentes
- **Integración de Sistemas Legacy:** Comunicarse con sistemas antiguos
- **Pruebas de Servicios de Red:** Probar servicios TCP/UDP
- **Difusión de Datos:** Enviar datos a múltiples endpoints
- **Monitoreo Remoto:** Enviar actualizaciones de estado a sistemas de monitoreo

### Triggers de Servidor (Recibiendo Datos)

- **Alternativas a Webhooks:** Recibir datos de aplicaciones personalizadas
- **Recolección de Datos de Dispositivos:** Recopilar datos de sensores IoT
- **Monitoreo de Red:** Monitorear tráfico y eventos de red
- **Endpoints de API Personalizados:** Crear APIs TCP/UDP simples
- **Notificaciones en Tiempo Real:** Recibir notificaciones instantáneas

## 🔧 Configuración Avanzada

### Consideraciones de Seguridad

- **Vincular a localhost (127.0.0.1)** solo para pruebas locales
- **Vincular a IP específica** para acceso controlado
- **Usar 0.0.0.0** solo cuando sea necesario para todas las interfaces
- **Implementar reglas de firewall adecuadas** para uso en producción

### Consejos de Rendimiento

- **TCP:** Usar persistencia de conexión para múltiples mensajes
- **UDP:** Ideal para mensajes pequeños y frecuentes
- **Codificación:** Usar codificaciones binarias para datos no textuales
- **Timeouts:** Ajustar según las condiciones de red

## 📄 Licencia

Licencia MIT - Ver archivo [LICENSE](LICENSE) para más detalles

## 🤝 Contribuyendo

¡Las contribuciones son bienvenidas! Por favor, siéntete libre de enviar un Pull Request.

## 🐛 Problemas y Soporte

¿Encontraste un error o necesitas ayuda? Por favor [abre un issue](https://github.com/DiegoDVG/n8n-nodes-network-basic-nodes/issues).

## 📊 Proyectos Relacionados

- [n8n](https://n8n.io/) - Plataforma de automatización de flujos de trabajo
- [n8n Community Nodes](https://docs.n8n.io/nodes/community-nodes/) - Nodos construidos por la comunidad
