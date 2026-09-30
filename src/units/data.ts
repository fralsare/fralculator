// Unit database: categories + conversion to/from a base unit.
// Temperature uses offset conversions (not pure factors).

export interface Unit {
  id: string;
  name: string;
  symbol: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

export interface Category {
  id: string;
  name: string;
  base: string;
  units: Unit[];
}

const factor = (f: number): { toBase: (v: number) => number; fromBase: (v: number) => number } => ({
  toBase: (v) => v * f,
  fromBase: (v) => v / f,
});

export const CATEGORIES: Category[] = [
  {
    id: 'length', name: 'Length', base: 'Meters',
    units: [
      { id: 'm', name: 'Meters', symbol: 'm', ...factor(1) },
      { id: 'km', name: 'Kilometers', symbol: 'km', ...factor(1000) },
      { id: 'cm', name: 'Centimeters', symbol: 'cm', ...factor(0.01) },
      { id: 'mm', name: 'Millimeters', symbol: 'mm', ...factor(0.001) },
      { id: 'mi', name: 'Miles', symbol: 'mi', ...factor(1609.344) },
      { id: 'yd', name: 'Yards', symbol: 'yd', ...factor(0.9144) },
      { id: 'ft', name: 'Feet', symbol: 'ft', ...factor(0.3048) },
      { id: 'in', name: 'Inches', symbol: 'in', ...factor(0.0254) },
      { id: 'nmi', name: 'Nautical miles', symbol: 'nmi', ...factor(1852) },
      { id: 'au', name: 'Astronomical units', symbol: 'au', ...factor(1.496e11) },
    ],
  },
  {
    id: 'mass', name: 'Mass / Weight', base: 'Kilograms',
    units: [
      { id: 'kg', name: 'Kilograms', symbol: 'kg', ...factor(1) },
      { id: 'g', name: 'Grams', symbol: 'g', ...factor(0.001) },
      { id: 'mg', name: 'Milligrams', symbol: 'mg', ...factor(1e-6) },
      { id: 't', name: 'Metric tons', symbol: 't', ...factor(1000) },
      { id: 'lb', name: 'Pounds', symbol: 'lb', ...factor(0.45359237) },
      { id: 'oz', name: 'Ounces', symbol: 'oz', ...factor(0.028349523) },
      { id: 'st', name: 'Stones', symbol: 'st', ...factor(6.350293) },
    ],
  },
  {
    id: 'temperature', name: 'Temperature', base: 'Celsius',
    units: [
      { id: 'c', name: 'Celsius', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', name: 'Fahrenheit', symbol: '°F', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: 'k', name: 'Kelvin', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    id: 'time', name: 'Time', base: 'Seconds',
    units: [
      { id: 's', name: 'Seconds', symbol: 's', ...factor(1) },
      { id: 'ms', name: 'Milliseconds', symbol: 'ms', ...factor(0.001) },
      { id: 'min', name: 'Minutes', symbol: 'min', ...factor(60) },
      { id: 'h', name: 'Hours', symbol: 'h', ...factor(3600) },
      { id: 'day', name: 'Days', symbol: 'd', ...factor(86400) },
      { id: 'wk', name: 'Weeks', symbol: 'wk', ...factor(604800) },
      { id: 'yr', name: 'Years', symbol: 'yr', ...factor(31557600) },
    ],
  },
  {
    id: 'speed', name: 'Speed', base: 'Meters/second',
    units: [
      { id: 'mps', name: 'Meters/second', symbol: 'm/s', ...factor(1) },
      { id: 'kmh', name: 'Kilometers/hour', symbol: 'km/h', ...factor(1 / 3.6) },
      { id: 'mph', name: 'Miles/hour', symbol: 'mph', ...factor(0.44704) },
      { id: 'kn', name: 'Knots', symbol: 'kn', ...factor(0.514444) },
      { id: 'mach', name: 'Mach (sea level)', symbol: 'Ma', ...factor(340.29) },
    ],
  },
  {
    id: 'area', name: 'Area', base: 'Square meters',
    units: [
      { id: 'm2', name: 'Square meters', symbol: 'm²', ...factor(1) },
      { id: 'km2', name: 'Square kilometers', symbol: 'km²', ...factor(1e6) },
      { id: 'cm2', name: 'Square centimeters', symbol: 'cm²', ...factor(1e-4) },
      { id: 'ha', name: 'Hectares', symbol: 'ha', ...factor(1e4) },
      { id: 'acre', name: 'Acres', symbol: 'ac', ...factor(4046.856) },
      { id: 'ft2', name: 'Square feet', symbol: 'ft²', ...factor(0.092903) },
      { id: 'mi2', name: 'Square miles', symbol: 'mi²', ...factor(2.59e6) },
    ],
  },
  {
    id: 'volume', name: 'Volume', base: 'Liters',
    units: [
      { id: 'l', name: 'Liters', symbol: 'L', ...factor(1) },
      { id: 'ml', name: 'Milliliters', symbol: 'mL', ...factor(0.001) },
      { id: 'm3', name: 'Cubic meters', symbol: 'm³', ...factor(1000) },
      { id: 'gal', name: 'Gallons (US)', symbol: 'gal', ...factor(3.78541) },
      { id: 'qt', name: 'Quarts (US)', symbol: 'qt', ...factor(0.946353) },
      { id: 'pt', name: 'Pints (US)', symbol: 'pt', ...factor(0.473176) },
      { id: 'cup', name: 'Cups (US)', symbol: 'cup', ...factor(0.236588) },
      { id: 'floz', name: 'Fluid ounces (US)', symbol: 'fl oz', ...factor(0.029574) },
    ],
  },
  {
    id: 'energy', name: 'Energy', base: 'Joules',
    units: [
      { id: 'j', name: 'Joules', symbol: 'J', ...factor(1) },
      { id: 'kj', name: 'Kilojoules', symbol: 'kJ', ...factor(1000) },
      { id: 'cal', name: 'Calories', symbol: 'cal', ...factor(4.184) },
      { id: 'kcal', name: 'Kilocalories (food)', symbol: 'kcal', ...factor(4184) },
      { id: 'kwh', name: 'Kilowatt-hours', symbol: 'kWh', ...factor(3.6e6) },
      { id: 'ev', name: 'Electronvolts', symbol: 'eV', ...factor(1.602e-19) },
      { id: 'btu', name: 'BTU', symbol: 'BTU', ...factor(1055.06) },
    ],
  },
  {
    id: 'data', name: 'Digital data', base: 'Bytes',
    units: [
      { id: 'b', name: 'Bytes', symbol: 'B', ...factor(1) },
      { id: 'kb', name: 'Kilobytes', symbol: 'KB', ...factor(1000) },
      { id: 'mb', name: 'Megabytes', symbol: 'MB', ...factor(1e6) },
      { id: 'gb', name: 'Gigabytes', symbol: 'GB', ...factor(1e9) },
      { id: 'tb', name: 'Terabytes', symbol: 'TB', ...factor(1e12) },
      { id: 'kib', name: 'Kibibytes', symbol: 'KiB', ...factor(1024) },
      { id: 'mib', name: 'Mebibytes', symbol: 'MiB', ...factor(1048576) },
      { id: 'gib', name: 'Gibibytes', symbol: 'GiB', ...factor(1073741824) },
      { id: 'bit', name: 'Bits', symbol: 'bit', ...factor(0.125) },
    ],
  },
  {
    id: 'frequency', name: 'Frequency', base: 'Hertz',
    units: [
      { id: 'hz', name: 'Hertz', symbol: 'Hz', ...factor(1) },
      { id: 'khz', name: 'Kilohertz', symbol: 'kHz', ...factor(1000) },
      { id: 'mhz', name: 'Megahertz', symbol: 'MHz', ...factor(1e6) },
      { id: 'ghz', name: 'Gigahertz', symbol: 'GHz', ...factor(1e9) },
    ],
  },
  {
    id: 'pressure', name: 'Pressure', base: 'Pascals',
    units: [
      { id: 'pa', name: 'Pascals', symbol: 'Pa', ...factor(1) },
      { id: 'kpa', name: 'Kilopascals', symbol: 'kPa', ...factor(1000) },
      { id: 'bar', name: 'Bar', symbol: 'bar', ...factor(1e5) },
      { id: 'atm', name: 'Atmospheres', symbol: 'atm', ...factor(101325) },
      { id: 'psi', name: 'PSI', symbol: 'psi', ...factor(6894.76) },
      { id: 'mmhg', name: 'mmHg', symbol: 'mmHg', ...factor(133.322) },
    ],
  },
];

/** Convert between two units inside the same category. */
export function convert(value: number, fromId: string, toId: string, categoryId: string): number {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) throw new Error('Unknown category');
  const from = cat.units.find((u) => u.id === fromId);
  const to = cat.units.find((u) => u.id === toId);
  if (!from || !to) throw new Error('Unknown unit');
  return to.fromBase(from.toBase(value));
}

/** Find a category by natural name (used by the NL "convert ... to ..." flow). */
export function findCategoryByName(names: string[]): Category | null {
  for (const n of names) {
    const cat = CATEGORIES.find((c) => c.name.toLowerCase().includes(n.toLowerCase()));
    if (cat) return cat;
  }
  return null;
}
