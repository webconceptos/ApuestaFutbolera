// Parser CSV mínimo (RFC4180: comillas, comas y saltos de línea dentro de
// campos entrecomillados, comillas escapadas como ""). Sin dependencia
// externa porque el único uso es la carga masiva de usuarios desde un
// archivo chico subido a mano (Paso post-29).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\r") {
      // ignorado; el \n que sigue cierra la fila
    } else if (char === "\n") {
      pushRow();
    } else {
      field += char;
    }
  }

  // Última fila si el archivo no termina en salto de línea.
  if (field.length > 0 || row.length > 0) pushRow();

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}
