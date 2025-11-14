# Network Basic Nodes para n8n

Un paquete completo de nodos comunitarios para n8n que proporciona funcionalidades de rede TCP e UDP con nodos especializados de cliente e servidor.

**🌐 Idiomas:** [English](README.md) | [Español](README.es.md) | [Galego](README.gl.md)

[![versión npm](https://badge.fury.io/js/n8n-nodes-network-basic-nodes.svg)](https://badge.fury.io/js/n8n-nodes-network-basic-nodes)
[![descargas npm](https://img.shields.io/npm/dm/n8n-nodes-network-basic-nodes.svg)](https://www.npmjs.com/package/n8n-nodes-network-basic-nodes)

## 📦 Instalación

Instala este paquete dende a biblioteca de nodos comunitarios de n8n:

### Opción 1: A través da interface de n8n (Recomendado)

1. Vai a **Configuración** → **Nodos Comunitarios**
2. Preme en **Instalar un nodo comunitario**
3. Introduce: `n8n-nodes-network-basic-nodes`
4. Preme en **Instalar**

### Opción 2: A través de npm

```bash
npm install n8n-nodes-network-basic-nodes
```

### Opción 3: A través de Docker

Engade esta liña ao teu entorno Docker de n8n:

```bash
-e N8N_COMMUNITY_PACKAGES="n8n-nodes-network-basic-nodes"
```

## 🚀 Nodos Incluídos

### Cliente TCP e Cliente UDP

**📤 Envía datos mediante protocolos TCP/UDP**

- **Categoría:** Accións
- **Iconas:** TCP (📡), UDP (📻)

**Características Principais:**

- Soporte para protocolos TCP e UDP
- Timeouts configurables de conexión e resposta
- Múltiples codificacións de texto (UTF-8, ASCII, Base64, Hex)
- Espera de resposta opcional e persistencia de conexión (TCP)
- Manexo integral de erros e reportes de estado

### Trigger do Servidor TCP e Trigger do Servidor UDP

**🖥️ Escoita conexións TCP/UDP entrantes**

- **Categoría:** Triggers
- **Iconas:** Servidor TCP (🖥️), Servidor UDP (📡)

**Características Principais:**

- Activación automática de fluxos de traballo ao recibir datos
- Vinculación de host configurable (localhost ou todas as interfaces)
- Control de límite de conexións (TCP)
- Resposta automática opcional a clientes
- Soporte de datos binarios con codificación base64

## 📋 Exemplos de Uso

### Enviando Datos (Nodos Cliente)

**Cliente TCP:**

```json
{
  "host": "192.168.1.100",
  "port": 8080,
  "message": "Ola Servidor TCP!",
  "waitForResponse": true,
  "encoding": "utf8"
}
```

**Cliente UDP:**

```json
{
  "host": "192.168.1.100",
  "port": 9090,
  "message": "Ola Servidor UDP!",
  "encoding": "utf8"
}
```

### Recibindo Datos (Triggers de Servidor)

**Exemplo de Saída:**

```json
{
  "protocol": "tcp",
  "server": { "host": "127.0.0.1", "port": 8080 },
  "client": { "remoteAddress": "192.168.1.50", "remotePort": 54321 },
  "data": "Mensaxe recibida",
  "encoding": "utf8",
  "bytes": 16,
  "timestamp": "2024-12-24T19:30:00.000Z"
}
```

## ⚙️ Configuración Predeterminada

| Configuración           | TCP       | UDP       |
| ----------------------- | --------- | --------- |
| **Porto**               | 8080      | 9090      |
| **Host**                | 127.0.0.1 | 127.0.0.1 |
| **Codificación**        | UTF-8     | UTF-8     |
| **Timeout de Conexión** | 5000ms    | N/A       |
| **Timeout de Resposta** | 3000ms    | 3000ms    |

## 🎯 Casos de Uso Comúns

### Nodos Cliente (Enviando Datos)

- **Comunicación IoT:** Enviar comandos a dispositivos intelixentes
- **Integración de Sistemas Legacy:** Comunicarse con sistemas antigos
- **Probas de Servizos de Rede:** Probar servizos TCP/UDP
- **Difusión de Datos:** Enviar datos a múltiples endpoints
- **Monitoreo Remoto:** Enviar actualizacións de estado a sistemas de monitoreo

### Triggers de Servidor (Recibindo Datos)

- **Alternativas a Webhooks:** Recibir datos de aplicacións personalizadas
- **Recolección de Datos de Dispositivos:** Recopilar datos de sensores IoT
- **Monitoreo de Rede:** Monitorear tráfico e eventos de rede
- **Endpoints de API Personalizados:** Crear APIs TCP/UDP simples
- **Notificacións en Tempo Real:** Recibir notificacións instantáneas

## 🔧 Configuración Avanzada

### Consideracións de Seguridade

- **Vincular a localhost (127.0.0.1)** só para probas locais
- **Vincular a IP específica** para acceso controlado
- **Usar 0.0.0.0** só cando sexa necesario para todas as interfaces
- **Implementar regras de firewall adecuadas** para uso en produción

### Consellos de Rendemento

- **TCP:** Usar persistencia de conexión para múltiples mensaxes
- **UDP:** Ideal para mensaxes pequenas e frecuentes
- **Codificación:** Usar codificacións binarias para datos non textuais
- **Timeouts:** Axustar segundo as condicións de rede

## 📄 Licenza

Licenza MIT - Ver arquivo [LICENSE](LICENSE) para máis detalles

## 🤝 Contribuíndo

As contribucións son benvidas! Por favor, síntete libre de enviar un Pull Request.

## 🐛 Problemas e Soporte

Atopaches un erro ou necesitas axuda? Por favor [abre un issue](https://github.com/DiegoDVG/n8n-nodes-network-basic-nodes/issues).

## 📊 Proxectos Relacionados

- [n8n](https://n8n.io/) - Plataforma de automatización de fluxos de traballo
- [n8n Community Nodes](https://docs.n8n.io/nodes/community-nodes/) - Nodos construídos pola comunidade
