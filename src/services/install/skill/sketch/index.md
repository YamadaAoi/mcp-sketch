## Hard Rules

1. **Never extract or decompress any archive, in any way**

## Fixed Commands

When the user types a command, makes a matching request in natural language, or the workflow calls for it, read and execute the corresponding file:

| Command            | Read and execute           | Description                           | Arguments                       |
| ------------------ | -------------------------- | ------------------------------------- | ------------------------------- |
| `/sketch init`     | `./references/init.md`     | Learn the project, check sketch setup | None                            |
| `/sketch overview` | `./references/overview.md` | Overview artboards in a design        | Design export (path)            |
| `/sketch draw`     | `./references/draw.md`     | Draw a page from the design           | Design & artboard (path, names) |

## Design Export Structure

```
file_path(design export 1)
└── page_name(page 1)
    ├── artboard_name(artboard 1)
    └── artboard_name(artboard 2)
```

## Tool Invocation

Prefer MCP tools (available when the mcp-sketch MCP server is configured); fall back to the CLI when unavailable:

| Feature            | MCP tool         | CLI                         |
| ------------------ | ---------------- | --------------------------- |
| Artboard list      | `sketch_list`    | `npx -y mcp-sketch list`    |
| Layer data         | `sketch_analyze` | `npx -y mcp-sketch analyze` |
| Dev server         | `sketch_dev`     | `npx -y mcp-sketch dev`     |
| Screenshot compare | `sketch_compare` | `npx -y mcp-sketch compare` |
