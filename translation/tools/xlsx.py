"""Read an .xlsx sheet as rows of strings, with the standard library only (openpyxl is not installed)."""
import re
import zipfile
from html import unescape


def _col(ref):
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group(0):
        n = n * 26 + ord(ch) - 64
    return n - 1


def sheets(path):
    z = zipfile.ZipFile(path)
    wb = z.read("xl/workbook.xml").decode("utf-8")
    names = [unescape(n) for n in re.findall(r'<sheet [^>]*name="([^"]+)"', wb)]
    strs = []
    if "xl/sharedStrings.xml" in z.namelist():
        ss = z.read("xl/sharedStrings.xml").decode("utf-8")
        for si in re.findall(r"<si>(.*?)</si>", ss, re.S):
            strs.append(unescape("".join(re.findall(r"<t[^>]*>(.*?)</t>", si, re.S))))
    out = {}
    for i, name in enumerate(names, 1):
        xml = z.read(f"xl/worksheets/sheet{i}.xml").decode("utf-8")
        rows = []
        for row in re.findall(r"<row[^>]*>(.*?)</row>", xml, re.S):
            cells = {}
            for m in re.finditer(r'<c r="([A-Z]+)\d+"([^>]*?)(?:/>|>(.*?)</c>)', row, re.S):
                ref, attrs, body = m.group(1), m.group(2), m.group(3) or ""
                v = re.search(r"<v>(.*?)</v>", body, re.S)
                t = re.search(r'\bt="(\w+)"', attrs)
                if t and t.group(1) == "s" and v:
                    val = strs[int(v.group(1))]
                elif t and t.group(1) == "inlineStr":
                    val = unescape("".join(re.findall(r"<t[^>]*>(.*?)</t>", body, re.S)))
                else:
                    val = unescape(v.group(1)) if v else ""
                cells[_col(ref)] = val
            if cells:
                rows.append([cells.get(k, "") for k in range(max(cells) + 1)])
        out[name] = rows
    return out
