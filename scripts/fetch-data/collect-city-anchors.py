#!/usr/bin/env python3
"""Pull city/metro official tables and write scripts/seed/city-anchors.json."""

from __future__ import annotations

import csv
import io
import json
import re
import time
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache"
OUT = ROOT / "scripts" / "seed" / "city-anchors.json"
UA = "US-State-Finder/1.0 (local research app; +https://github.com/) Mozilla/5.0"

STATE_NAME = {
    "AL": "ALABAMA", "AK": "ALASKA", "AZ": "ARIZONA", "AR": "ARKANSAS", "CA": "CALIFORNIA",
    "CO": "COLORADO", "CT": "CONNECTICUT", "DC": "DISTRICT OF COLUMBIA", "DE": "DELAWARE",
    "FL": "FLORIDA", "GA": "GEORGIA", "HI": "HAWAII", "ID": "IDAHO", "IL": "ILLINOIS",
    "IN": "INDIANA", "IA": "IOWA", "KS": "KANSAS", "KY": "KENTUCKY", "LA": "LOUISIANA",
    "ME": "MAINE", "MD": "MARYLAND", "MA": "MASSACHUSETTS", "MI": "MICHIGAN", "MN": "MINNESOTA",
    "MS": "MISSISSIPPI", "MO": "MISSOURI", "MT": "MONTANA", "NE": "NEBRASKA", "NV": "NEVADA",
    "NH": "NEW HAMPSHIRE", "NJ": "NEW JERSEY", "NM": "NEW MEXICO", "NY": "NEW YORK",
    "NC": "NORTH CAROLINA", "ND": "NORTH DAKOTA", "OH": "OHIO", "OK": "OKLAHOMA", "OR": "OREGON",
    "PA": "PENNSYLVANIA", "RI": "RHODE ISLAND", "SC": "SOUTH CAROLINA", "SD": "SOUTH DAKOTA",
    "TN": "TENNESSEE", "TX": "TEXAS", "UT": "UTAH", "VT": "VERMONT", "VA": "VIRGINIA",
    "WA": "WASHINGTON", "WV": "WEST VIRGINIA", "WI": "WISCONSIN", "WY": "WYOMING",
}

CRIME_ALIASES = {
    ("KENTUCKY", "Louisville Metro"): "louisville",
    ("TENNESSEE", "Metropolitan Nashville Police Department"): "nashville",
    ("DISTRICT OF COLUMBIA", "Washington"): "washington",
    ("CALIFORNIA", "Los Angeles"): "los-angeles",
    ("NEVADA", "Las Vegas Metropolitan Police Department"): "las-vegas",
    ("NORTH CAROLINA", "Charlotte-Mecklenburg"): "charlotte",
}

STATE_FIPS = {
    "AL": "01", "AK": "02", "AZ": "04", "AR": "05", "CA": "06", "CO": "08", "CT": "09",
    "DC": "11", "DE": "10", "FL": "12", "GA": "13", "HI": "15", "ID": "16", "IL": "17",
    "IN": "18", "IA": "19", "KS": "20", "KY": "21", "LA": "22", "ME": "23", "MD": "24",
    "MA": "25", "MI": "26", "MN": "27", "MS": "28", "MO": "29", "MT": "30", "NE": "31",
    "NV": "32", "NH": "33", "NJ": "34", "NM": "35", "NY": "36", "NC": "37", "ND": "38",
    "OH": "39", "OK": "40", "OR": "41", "PA": "42", "RI": "44", "SC": "45", "SD": "46",
    "TN": "47", "TX": "48", "UT": "49", "VT": "50", "VA": "51", "WA": "53", "WV": "54",
    "WI": "55", "WY": "56",
}

YEARS = [str(y) for y in range(2019, 2027)]


def parse_seeds() -> list[dict]:
    text = (ROOT / "scripts" / "seed" / "cities.ts").read_text()
    seeds = []
    for m in re.finditer(
        r"id: '([^']+)', name: '([^']+)', state: '([^']+)'.*?place: '([^']+)', cbsa: '([^']+)', county: \[([^\]]+)\]",
        text,
        re.S,
    ):
        county = [c.strip().strip("'\"") for c in m.group(6).split(",") if c.strip()]
        seeds.append(
            {
                "id": m.group(1),
                "name": m.group(2),
                "state": m.group(3),
                "place": m.group(4),
                "cbsa": m.group(5),
                "county": county,
            }
        )
    if len(seeds) != 50:
        raise SystemExit(f"expected 50 city seeds, got {len(seeds)}")
    return seeds


def unzip_csv(zip_path: Path, name_contains: str) -> str:
    with zipfile.ZipFile(zip_path) as z:
        name = next(n for n in z.namelist() if name_contains in n and n.endswith(".csv"))
        return z.read(name).decode("utf-8", "replace")


def bea_rows(text: str) -> list[dict]:
    return list(csv.DictReader(io.StringIO(text)))


def clean_fips(v: str) -> str:
    return (v or "").strip().strip('"').strip()


def series_from_row(row: dict, years: list[str]) -> dict[str, float]:
    out = {}
    for y in years:
        raw = row.get(y)
        if raw is None:
            continue
        try:
            n = float(str(raw).replace(",", ""))
        except ValueError:
            continue
        if n > 0:
            out[y] = n
    return out


def fill_forward(series: dict[str, float], years: list[str]) -> dict[str, float]:
    last = None
    out = dict(series)
    for y in years:
        if y in out:
            last = out[y]
        elif last is not None:
            out[y] = last
    return out


def load_marpp(seeds: list[dict]) -> tuple[dict, dict]:
    text = unzip_csv(CACHE / "MARPP.zip", "MARPP_MSA")
    rpp: dict[str, dict[str, float]] = {}
    rent: dict[str, dict[str, float]] = {}
    for row in bea_rows(text):
        fips = clean_fips(row.get("GeoFIPS", ""))
        desc = (row.get("Description") or "").strip()
        series = series_from_row(row, [str(y) for y in range(2019, 2025)])
        if not series:
            continue
        if desc.startswith("RPPs: All items"):
            rpp[fips] = fill_forward(series, YEARS)
        elif "Housing" in desc:
            rent[fips] = fill_forward(series, YEARS)
    return rpp, rent


def load_county_gdp() -> tuple[dict, dict, dict]:
    gdp_text = unzip_csv(CACHE / "CAGDP1.zip", "ALL_AREAS")
    pop_text = unzip_csv(CACHE / "CAINC1.zip", "ALL_AREAS")
    gdp: dict[str, dict[str, float]] = {}
    pop: dict[str, dict[str, float]] = {}
    for row in bea_rows(gdp_text):
        if str(row.get("LineCode") or "").strip() != "3":
            continue
        fips = clean_fips(row.get("GeoFIPS", ""))
        gdp[fips] = series_from_row(row, [str(y) for y in range(2019, 2025)])
    for row in bea_rows(pop_text):
        if str(row.get("LineCode") or "").strip() != "2":
            continue
        fips = clean_fips(row.get("GeoFIPS", ""))
        pop[fips] = series_from_row(row, [str(y) for y in range(2019, 2025)])
    return gdp, pop


def county_gdp_pc(counties: list[str], gdp: dict, pop: dict) -> dict[str, float]:
    out: dict[str, float] = {}
    for y in [str(x) for x in range(2019, 2025)]:
        gsum = 0.0
        psum = 0.0
        for fips in counties:
            g = gdp.get(fips, {}).get(y)
            p = pop.get(fips, {}).get(y)
            if g and p:
                gsum += g  # thousands of dollars
                psum += p
        if psum:
            out[y] = round(gsum * 1000 / psum)
    return fill_forward(out, YEARS)


def load_industries(seeds: list[dict]) -> dict[str, list[list]]:
    needed = {f for s in seeds for f in s["county"]}
    wanted_states = {s["state"] for s in seeds}
    # CAGDP2 is large; only read ALL_AREAS if present, else skip.
    zpath = CACHE / "CAGDP2.zip"
    if not zpath.exists():
        return {}
    with zipfile.ZipFile(zpath) as z:
        name = next((n for n in z.namelist() if "ALL_AREAS" in n and n.endswith(".csv")), None)
        if not name:
            # concatenate needed state files
            chunks = []
            for n in z.namelist():
                st = Path(n).stem.split("_")
                if len(st) >= 2 and st[1] in wanted_states and n.endswith(".csv"):
                    chunks.append(z.read(n).decode("utf-8", "replace"))
            if not chunks:
                return {}
            header = chunks[0].splitlines()[0]
            body = []
            for ch in chunks:
                body.extend(ch.splitlines()[1:])
            text = header + "\n" + "\n".join(body)
        else:
            text = z.read(name).decode("utf-8", "replace")
    by_county: dict[str, list[tuple[str, float]]] = defaultdict(list)
    for row in bea_rows(text):
        fips = clean_fips(row.get("GeoFIPS", ""))
        if fips not in needed:
            continue
        desc = (row.get("Description") or "").strip()
        low = desc.lower()
        if not desc or desc.startswith("  "):
            continue
        if low.startswith("all industry") or "private industries" in low:
            continue
        if "goods-producing" in low or "services-providing" in low:
            continue
        raw = row.get("2024") or row.get("2023")
        try:
            val = float(str(raw).replace(",", ""))
        except (TypeError, ValueError):
            continue
        if val <= 0:
            continue
        by_county[fips].append((re.sub(r"\s+", " ", desc).strip(), val))
    out: dict[str, list[list]] = {}
    for seed in seeds:
        items: dict[str, float] = {}
        for fips in seed["county"]:
            for sector, val in by_county.get(fips, []):
                items[sector] = items.get(sector, 0) + val
        top = sorted(items.items(), key=lambda x: -x[1])[:5]
        total = sum(v for _, v in top) or 1
        out[seed["id"]] = [[k, round(v / total, 4)] for k, v in top]
    return out


def parse_xlsx_rows(xlsx_path: Path) -> dict[int, dict[str, str]]:
    with zipfile.ZipFile(xlsx_path) as z:
        ss_root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        ss = []
        for si in ss_root.findall("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si"):
            texts = list(si.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"))
            ss.append("".join(t.text or "" for t in texts))
        sheet = next(n for n in z.namelist() if n.startswith("xl/worksheets/sheet"))
        root = ET.fromstring(z.read(sheet))
        rows: dict[int, dict[str, str]] = defaultdict(dict)
        for c in root.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c"):
            ref = c.get("r")
            if not ref:
                continue
            m = re.match(r"([A-Z]+)(\d+)", ref)
            col, row = m.group(1), int(m.group(2))
            v = c.find("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v")
            if v is None or v.text is None:
                continue
            rows[row][col] = ss[int(v.text)] if c.get("t") == "s" else v.text
        return rows


def load_crime(seeds: list[dict]) -> dict[str, tuple[float, float]]:
    with zipfile.ZipFile(CACHE / "table8.zip") as z:
        xlsx = next(n for n in z.namelist() if n.endswith(".xlsx"))
        dest = CACHE / Path(xlsx).name
        if not dest.exists():
            z.extract(xlsx, CACHE)
            dest = CACHE / xlsx
    rows = parse_xlsx_rows(CACHE / Path(xlsx).name if (CACHE / Path(xlsx).name).exists() else dest)
    by_id = {(STATE_NAME[s["state"]], s["name"].lower()): s["id"] for s in seeds}
    for (st, name), cid in list(CRIME_ALIASES.items()):
        by_id[(st, name.lower())] = cid
    out: dict[str, tuple[float, float]] = {}
    state = ""
    for r in sorted(rows):
        cols = rows[r]
        a = (cols.get("A") or "").strip()
        b = (cols.get("B") or "").strip()
        if a and a.isupper() or (a and "COLUMBIA" in a) or (a and a.rstrip("0123456789").isupper()):
            if a not in {"State"} and not a.startswith("Table") and not a.startswith("Offenses"):
                state = re.sub(r"\d+$", "", a).strip()
        if not b or not cols.get("C"):
            continue
        try:
            pop = float(cols["C"])
            violent = float(cols.get("D") or 0)
            prop = float(cols.get("I") or 0)
        except ValueError:
            continue
        if pop < 50_000:
            continue
        city_name = re.sub(r"\d+$", "", b).strip().lower()
        cid = by_id.get((state, city_name)) or by_id.get((state, b.lower()))
        if not cid:
            continue
        out[cid] = (round(violent / pop * 1e5, 1), round(prop / pop * 1e5, 1))
    return out


def load_zillow(seeds: list[dict]) -> dict[str, dict[str, int]]:
    path = CACHE / "zillow-city.csv"
    text = path.read_text(errors="replace")
    rows = csv.DictReader(io.StringIO(text))
    by_key: dict[str, dict[str, str]] = {}
    for row in rows:
        name = (row.get("RegionName") or "").strip().lower()
        st = (row.get("State") or row.get("StateName") or "").strip()
        if len(st) > 2:
            # StateName is full name; State is abbr
            st = (row.get("State") or "").strip()
        by_key[f"{name}|{st}"] = row
    out: dict[str, dict[str, int]] = {}
    for s in seeds:
        row = by_key.get(f"{s['name'].lower()}|{s['state']}")
        if not row:
            continue
        series: dict[str, int] = {}
        for y in range(2019, 2027):
            vals = []
            for k, v in row.items():
                if k.startswith(f"{y}-"):
                    try:
                        n = float(v)
                    except (TypeError, ValueError):
                        continue
                    if n > 0:
                        vals.append(n)
            if vals:
                series[str(y)] = int(round(sum(vals) / len(vals)))
        if series:
            out[s["id"]] = series
    return out


def http_json(url: str, data: bytes | None = None, timeout: int = 60):
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def load_bls(seeds: list[dict]) -> tuple[dict, dict]:
    series_map = {}
    for s in seeds:
        series_map[f"LAUCT{s['place']}00000003"] = (s["id"], "unemp")
        series_map[f"LAUCT{s['place']}00000005"] = (s["id"], "emp")
    ids = list(series_map)
    payload_series: dict[str, list] = {}
    for i in range(0, len(ids), 25):
        chunk = ids[i : i + 25]
        body = json.dumps({"seriesid": chunk, "startyear": "2019", "endyear": "2026"}).encode()
        data = http_json("https://api.bls.gov/publicAPI/v2/timeseries/data/", body)
        if data.get("status") != "REQUEST_SUCCEEDED":
            raise SystemExit(f"BLS failed: {data}")
        for s in data["Results"]["series"]:
            payload_series[s["seriesID"]] = s.get("data") or []
        time.sleep(0.3)

    unemp: dict[str, dict[str, float]] = defaultdict(dict)
    emp: dict[str, dict[str, float]] = defaultdict(dict)

    def add_rows(cid: str, kind: str, rows: list) -> None:
        by_year: dict[str, list[float]] = defaultdict(list)
        for d in rows:
            if not re.match(r"M\d{2}$", d.get("period") or ""):
                continue
            if d["period"] == "M13":
                continue
            try:
                by_year[d["year"]].append(float(d["value"]))
            except ValueError:
                continue
        target = unemp if kind == "unemp" else emp
        for y, vals in by_year.items():
            if not vals:
                continue
            avg = sum(vals) / len(vals)
            target[cid][y] = round(avg, 1) if kind == "unemp" else round(avg / 1000, 1)

    for sid, rows in payload_series.items():
        cid, kind = series_map[sid]
        add_rows(cid, kind, rows)

    missing = [s for s in seeds if not unemp.get(s["id"])]
    if missing:
        metro_map = {}
        for s in missing:
            sf = STATE_FIPS[s["state"]]
            metro_map[f"LAUMT{sf}{s['cbsa']}00000003"] = (s["id"], "unemp")
            metro_map[f"LAUMT{sf}{s['cbsa']}00000005"] = (s["id"], "emp")
        body = json.dumps({"seriesid": list(metro_map), "startyear": "2019", "endyear": "2026"}).encode()
        data = http_json("https://api.bls.gov/publicAPI/v2/timeseries/data/", body)
        for series in data.get("Results", {}).get("series", []):
            cid, kind = metro_map[series["seriesID"]]
            add_rows(cid, kind, series.get("data") or [])
    return dict(unemp), dict(emp)


AGE_MALE = {
    "0-17": range(3, 7),
    "18-34": range(7, 13),
    "35-54": range(13, 17),
    "55-64": range(17, 20),
    "65+": range(20, 26),
}
AGE_FEMALE = {
    "0-17": range(27, 31),
    "18-34": range(31, 37),
    "35-54": range(37, 41),
    "55-64": range(41, 44),
    "65+": range(44, 50),
}


def load_acs(seeds: list[dict]) -> dict[str, dict]:
    by_geo = {f"16000US{s['place']}": s["id"] for s in seeds}
    geos = list(by_geo)
    data = {}
    for i in range(0, len(geos), 8):
        chunk = geos[i : i + 8]
        url = (
            "https://api.censusreporter.org/1.0/data/show/latest?"
            + "table_ids=B01001,B01002,B03002&geo_ids="
            + ",".join(chunk)
        )
        payload = http_json(url, timeout=90)
        data.update(payload.get("data") or {})
        time.sleep(0.2)
    out: dict[str, dict] = {}
    for geo, cid in by_geo.items():
        block = data.get(geo) or {}
        age_est = ((block.get("B01002") or {}).get("estimate") or {})
        race = ((block.get("B03002") or {}).get("estimate") or {})
        buckets = ((block.get("B01001") or {}).get("estimate") or {})
        total = race.get("B03002001") or 0
        demo = None
        if total:
            demo = {
                "white": round((race.get("B03002003") or 0) / total, 4),
                "black": round((race.get("B03002004") or 0) / total, 4),
                "native": round((race.get("B03002005") or 0) / total, 4),
                "asian": round((race.get("B03002006") or 0) / total, 4),
                "pacific": round((race.get("B03002007") or 0) / total, 4),
                "multi": round((race.get("B03002009") or 0) / total, 4),
                "hispanic": round((race.get("B03002012") or 0) / total, 4),
            }
        age = None
        pop = buckets.get("B01001001") or 0
        if pop:
            def share(keys):
                return round(sum(buckets.get(f"B01001{str(k).zfill(3)}") or 0 for k in keys) / pop, 3)

            age = {
                "0-17": share(list(AGE_MALE["0-17"]) + list(AGE_FEMALE["0-17"])),
                "18-34": share(list(AGE_MALE["18-34"]) + list(AGE_FEMALE["18-34"])),
                "35-54": share(list(AGE_MALE["35-54"]) + list(AGE_FEMALE["35-54"])),
                "55-64": share(list(AGE_MALE["55-64"]) + list(AGE_FEMALE["55-64"])),
                "65+": share(list(AGE_MALE["65+"]) + list(AGE_FEMALE["65+"])),
            }
        out[cid] = {
            "medianAge": age_est.get("B01002001"),
            "demo": demo,
            "age": age,
        }
    return out


def job_growth(emp: dict[str, float]) -> dict[str, float]:
    out = {}
    for y in range(2019, 2027):
        cur = emp.get(str(y))
        prev = emp.get(str(y - 1))
        if cur and prev:
            out[str(y)] = round((cur - prev) / prev * 100, 2)
    return out


def main() -> None:
    seeds = parse_seeds()
    print("seeds", len(seeds))
    print("MARPP...")
    rpp, rent = load_marpp(seeds)
    print("GDP...")
    gdp, pop = load_county_gdp()
    print("industries...")
    industries = load_industries(seeds)
    print("crime...")
    crime = load_crime(seeds)
    print("zillow...")
    homes = load_zillow(seeds)
    print("BLS...")
    unemp, emp = load_bls(seeds)
    print("ACS...")
    acs = load_acs(seeds)

    out = {}
    missing = defaultdict(list)
    for s in seeds:
        cid = s["id"]
        a = {
            "medianAge": (acs.get(cid) or {}).get("medianAge"),
            "demo": (acs.get(cid) or {}).get("demo"),
            "age": (acs.get(cid) or {}).get("age"),
            "costOfLiving": {k: round(v, 1) for k, v in (rpp.get(s["cbsa"]) or {}).items()},
            "rentIndex": {k: round(v, 1) for k, v in (rent.get(s["cbsa"]) or {}).items()},
            "gdpPerCapita": county_gdp_pc(s["county"], gdp, pop),
            "unemploymentRate": unemp.get(cid) or {},
            "employment": emp.get(cid) or {},
            "homeValue": homes.get(cid) or {},
            "industries": industries.get(cid) or [],
        }
        a["jobGrowth"] = job_growth(a["employment"])
        if cid in crime:
            a["violent"] = crime[cid][0]
            a["property"] = crime[cid][1]
        for key in ["medianAge", "demo", "age", "costOfLiving", "gdpPerCapita", "unemploymentRate", "homeValue"]:
            if not a.get(key):
                missing[key].append(cid)
        if "violent" not in a:
            missing["crime"].append(cid)
        out[cid] = a

    OUT.write_text(json.dumps(out, indent=2))
    print("wrote", OUT)
    for k, ids in missing.items():
        print("missing", k, len(ids), ids)


if __name__ == "__main__":
    main()
