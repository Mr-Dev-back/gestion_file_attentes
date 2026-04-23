import { Card, CardContent, CardHeader, CardTitle } from '../molecules/ui/card';

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string|number} props.avg
 * @param {string|number} props.min
 * @param {string|number} props.max
 * @param {string} props.unit
 * @param {string} props.color
 */
export default function StatCard({ title, avg, min, max, unit, color = "text-indigo-600" }) {
  return (
    <Card className="rounded-xl shadow-sm border-slate-100 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>
          {avg} <span className="text-sm font-normal text-slate-400">{unit}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-500 border-t pt-3">
          <div>
            <span className="block font-semibold">Min</span>
            {min} {unit}
          </div>
          <div>
            <span className="block font-semibold">Max</span>
            {max} {unit}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
