import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

interface ModelApplication {
  id: string;
  status: string;
  created_at: string;
}

interface ApplicationStatsProps {
  applications: ModelApplication[];
}

export const ApplicationStats = ({ applications }: ApplicationStatsProps) => {
  // Calculate stats
  const approved = applications.filter(a => a.status === 'approved').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;
  const pending = applications.filter(a => a.status === 'pending').length;
  const inProgress = applications.filter(a => a.status === 'in_progress').length;

  // Group by last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(day => {
    const dayApps = applications.filter(a => a.created_at.split('T')[0] === day);
    return {
      date: new Date(day).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' }),
      approved: dayApps.filter(a => a.status === 'approved').length,
      rejected: dayApps.filter(a => a.status === 'rejected').length,
      pending: dayApps.filter(a => a.status === 'pending').length,
      total: dayApps.length
    };
  });

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{approved}</p>
                <p className="text-xs text-slate-400">Одобрено</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{rejected}</p>
                <p className="text-xs text-slate-400">Отклонено</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pending}</p>
                <p className="text-xs text-slate-400">На рассмотрении</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{applications.length}</p>
                <p className="text-xs text-slate-400">Всего</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-slate-900/50 border-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-slate-300">Заявки за последние 7 дней</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="approved" stackId="a" fill="#10b981" name="Одобрено" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" stackId="a" fill="#eab308" name="На рассмотрении" radius={[0, 0, 0, 0]} />
                <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Отклонено" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
