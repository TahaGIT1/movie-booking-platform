/** Builds the "Theatre · Date · Time · Format · Language" subtitle from real show data. */
const FORMAT_LABELS = { TWO_D: '2D', THREE_D: '3D', IMAX_2D: 'IMAX 2D', IMAX_3D: 'IMAX 3D', FOUR_DX: '4DX' };
const CENSOR_LABELS = new Set(['U', 'UA', 'U/A', 'A', 'S', 'PG', 'PG-13', 'R', 'G', 'NC-17', '18', '13', 'P13', '18SG', '18SX', '16']);

export function showSubtitleParts({ selectedTheatre, selectedDate, selectedTime, activeShow, item }) {
    const format = activeShow?.visualFormat
        ? FORMAT_LABELS[activeShow.visualFormat] || activeShow.visualFormat
        : (item?.formats || []).find((f) => !CENSOR_LABELS.has(String(f).toUpperCase()));
    const language = activeShow?.languageVersion || item?.language || item?.originalLanguage;
    return [selectedTheatre, selectedDate, selectedTime, format, language].filter(Boolean);
}
