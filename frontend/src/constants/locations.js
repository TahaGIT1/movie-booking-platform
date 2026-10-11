/**
 * Location configuration.
 *
 * The platform is currently being rolled out for a single pilot market, so the
 * default location is Belagavi, Karnataka. Everything outside that market is
 * intentionally hidden rather than shown as unavailable.
 */

export const DEFAULT_LOCATION = {
  id: 'belagavi',
  label: 'Belagavi, KA',
  city: 'Belagavi',
  state: 'Karnataka',
};

export const LOCATIONS = [
  DEFAULT_LOCATION,
  { id: 'bengaluru', label: 'Bengaluru, KA', city: 'Bengaluru', state: 'Karnataka' },
  { id: 'mumbai', label: 'Mumbai, MH', city: 'Mumbai', state: 'Maharashtra' },
  { id: 'pune', label: 'Pune, MH', city: 'Pune', state: 'Maharashtra' },
  { id: 'hyderabad', label: 'Hyderabad, TS', city: 'Hyderabad', state: 'Telangana' },
  { id: 'chennai', label: 'Chennai, TN', city: 'Chennai', state: 'Tamil Nadu' },
  { id: 'kochi', label: 'Kochi, KL', city: 'Kochi', state: 'Kerala' },
];

/**
 * Substrings used to decide whether a theatre/show record belongs to Belagavi.
 *
 * Records from the seed data carry a free-text theatre name rather than a
 * normalised city column, so matching has to happen on the name. Keeping the
 * matcher here (instead of inline in each page) means adding a second pilot
 * city later is a one-line change.
 */
const BELAGAVI_THEATRE_TOKENS = [
  'belagavi',
  'belgaum',
  'belagum',
  'karnataka',
  'sangli',
  'savadi',
  'gokak',
  'khanapur',
  'bhokardan',
];

const norm = (value) => String(value || '').toLowerCase();

/**
 * True when a record (theatre, show or booking) is available in Belagavi.
 * Records with no location information at all are treated as in-market so a
 * missing field never hides an otherwise bookable item.
 */
export function isAvailableInBelagavi(record) {
  if (!record || typeof record !== 'object') return false;

  const haystacks = [
    record.city,
    record.theatreCity,
    record.location,
    record.theatreName,
    record.theatre,
    record.venue,
    record.venueName,
  ]
    .map(norm)
    .filter(Boolean);

  if (haystacks.length === 0) return true;

  return haystacks.some((value) =>
    BELAGAVI_THEATRE_TOKENS.some((token) => value.includes(token))
  );
}

/**
 * Filters a list of records down to the ones available in Belagavi.
 * Non-array input (or a failed lookup) yields an empty list rather than
 * throwing, so callers can render an empty state.
 */
export function filterByBelagavi(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(isAvailableInBelagavi);
}

/** Human-readable city label used in banners and receipts. */
export const ACTIVE_CITY_LABEL = DEFAULT_LOCATION.city.toUpperCase();