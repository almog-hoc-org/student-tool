import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Home, 
  Calculator, 
  Clock, 
  Sparkles, 
  Zap, 
  AlertCircle, 
  Wrench,
  GitCompare,
  ArrowRight,
  LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Recommendation } from '@/lib/recommendations/analyzer';

interface RecommendationCardProps {
  recommendations: Recommendation[];
}

const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  Home,
  Calculator,
  Clock,
  Sparkles,
  Zap,
  AlertCircle,
  Wrench,
  GitCompare
};

const priorityColors = {
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
};

const priorityLabels = {
  high: 'דחוף',
  medium: 'מומלץ',
  low: 'רעיון'
};

export function RecommendationCard({ recommendations }: RecommendationCardProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          המלצות אישיות עבורך
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec, index) => {
            const Icon = iconMap[rec.icon] || Sparkles;
            const content = (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{rec.title}</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${priorityColors[rec.priority]}`}
                    >
                      {priorityLabels[rec.priority]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </motion.div>
            );

            if (rec.link) {
              return (
                <Link key={rec.id} to={rec.link}>
                  {content}
                </Link>
              );
            }

            return <div key={rec.id}>{content}</div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
