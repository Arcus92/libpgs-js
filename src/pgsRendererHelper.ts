export class PgsRendererHelper {
    /**
     * Returns the array index position for the previous timestamp position from the given array.
     * Returns -1 if the given time is outside the timestamp range.
     * @param time The timestamp to check in seconds.
     * @param pgsTimestamps The list of available PGS timestamps.
     */
    public static getIndexFromTimestamps(time: number, pgsTimestamps: number[]): number {
        const pgsTime = time * 1000 * 90; // Convert to PGS time

        // All position before and after the available timestamps are invalid (-1).
        let index = -1;
        if (pgsTimestamps.length > 0 && pgsTime < pgsTimestamps[pgsTimestamps.length - 1]) {

            // Find the last subtitle index for the given time stamp
            for (const pgsTimestamp of pgsTimestamps) {

                if (pgsTimestamp > pgsTime) {
                    break;
                }
                index++;
            }
        }

        return index;
    }
}