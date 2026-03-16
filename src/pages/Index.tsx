import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calculator,
  Home,
  TrendingUp,
  Hammer,
  ClipboardCheck,
  Calendar,
  Building2,
  ChevronLeft,
  BookOpen,
  BarChart3,
  Bookmark,
  Receipt,
  Zap
} from 'lucide-react';

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

interface PrimaryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  iconBg: string;
  index: number;
}

function PrimaryCard({ title, description, icon, link, iconBg, index }: PrimaryCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Link to={link} className="block">
        <Card className="hover:shadow-md transition-shadow duration-300 h-full">
          <CardContent className="p-4 sm:p-5">
            <motion.div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${iconBg}`}
              whileHover={{ rotate: [0, -6, 6, 0], transition: { duration: 0.4 } }}
            >
              {icon}
            </motion.div>
            <h3 className="text-base font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground leading-snug mb-3">
              {description}
            </p>
            <div className="flex items-center gap-1 text-primary text-sm font-medium">
              <span>בוא נתחיל</span>
              <ChevronLeft className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

interface SecondaryItemProps {
  title: string;
  icon: React.ReactNode;
  link: string;
  iconBg: string;
}

function SecondaryItem({ title, icon, link, iconBg }: SecondaryItemProps) {
  return (
    <motion.div variants={fadeUp} whileTap={{ scale: 0.98 }}>
      <Link to={link} className="block">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 active:bg-muted/50 transition-colors duration-150">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            {icon}
          </div>
          <span className="text-sm font-medium flex-1">{title}</span>
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </div>
      </Link>
    </motion.div>
  );
}

export default function Index() {
  const primaryTools = [
    {
      title: 'בדיקה פיננסית',
      description: 'כמה באמת יש לך? גלה בדיוק כמה דירה אתה יכול לקנות',
      icon: <Calculator className="w-6 h-6 text-primary" />,
      link: '/financial-checkup',
      iconBg: 'bg-primary/10',
    },
    {
      title: 'מחשבון משכנתא',
      description: 'בנה תמהיל, השווה מסלולים וראה כמה תשלם — חודשי וכולל',
      icon: <Home className="w-6 h-6 text-primary" />,
      link: '/mortgage-calculator',
      iconBg: 'bg-primary/10',
    },
    {
      title: 'תוכנית עסקית',
      description: 'שווה לקנות? בדוק תשואה, IRR ותזרים על כל עסקה',
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      link: '/deal-business-plan',
      iconBg: 'bg-primary/10',
    },
  ];

  const secondaryTools = [
    {
      title: 'מחשבון מס רכישה',
      icon: <Receipt className="w-5 h-5 text-muted-foreground" />,
      link: '/purchase-tax',
      iconBg: 'bg-muted',
    },
    {
      title: 'כדאיות שיפוץ',
      icon: <Hammer className="w-5 h-5 text-muted-foreground" />,
      link: '/renovation-feasibility',
      iconBg: 'bg-muted',
    },
    {
      title: 'ביקור בנכס',
      icon: <ClipboardCheck className="w-5 h-5 text-muted-foreground" />,
      link: '/property-visit',
      iconBg: 'bg-muted',
    },
    {
      title: 'ציר זמן לעסקה',
      icon: <Calendar className="w-5 h-5 text-muted-foreground" />,
      link: '/transaction-timeline',
      iconBg: 'bg-muted',
    },
    {
      title: 'התחדשות עירונית',
      icon: <Building2 className="w-5 h-5 text-muted-foreground" />,
      link: '/urban-renewal',
      iconBg: 'bg-muted',
    },
  ];

  const utilityLinks = [
    { title: 'סטטיסטיקות', icon: <BarChart3 className="w-4 h-4 text-primary" />, link: '/dashboard', iconBg: 'bg-primary/10' },
    { title: 'תרחישים שמורים', icon: <Bookmark className="w-4 h-4 text-primary" />, link: '/history', iconBg: 'bg-primary/10' },
    { title: 'מילון מונחים', icon: <BookOpen className="w-4 h-4 text-primary" />, link: '/glossary', iconBg: 'bg-primary/10' },
  ];

  return (
    <motion.div
      className="space-y-6 max-w-2xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {/* Header */}
      <motion.div className="py-4" variants={fadeUp}>
        <h1 className="text-2xl font-bold">ארגז הכלים</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          הדרך לדירה – כל הכלים שצריך כדי לקנות דירה בביטחון
        </p>
      </motion.div>

      {/* Quick Check — Hero CTA */}
      <motion.div variants={scaleIn} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
        <Link to="/quick-check" className="block">
          <Card className="border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.06] hover:shadow-md transition-all duration-300">
            <CardContent className="p-4 flex items-center gap-4">
              <motion.div
                className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0"
                animate={{ boxShadow: ['0 0 0px hsl(var(--primary) / 0.3)', '0 0 16px hsl(var(--primary) / 0.15)', '0 0 0px hsl(var(--primary) / 0.3)'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Zap className="w-6 h-6 text-primary-foreground" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold mb-0.5">מצאת דירה? בדוק עכשיו</h3>
                <p className="text-sm text-muted-foreground">הכנס מחיר וקבל מיד — מס, עלויות והחזר חודשי</p>
              </div>
              <ChevronLeft className="w-5 h-5 text-primary flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Primary Tools */}
      <motion.div className="space-y-3" variants={fadeUp}>
        <h2 className="text-base font-semibold">כלים מרכזיים</h2>
        <motion.div
          className="grid sm:grid-cols-3 gap-3"
          variants={stagger}
        >
          {primaryTools.map((tool, i) => (
            <PrimaryCard key={tool.link} {...tool} index={i} />
          ))}
        </motion.div>
      </motion.div>

      {/* Secondary Tools - list style */}
      <motion.div className="space-y-1" variants={fadeUp}>
        <h2 className="text-base font-semibold mb-2">כלים נוספים</h2>
        <Card>
          <CardContent className="p-1">
            <motion.div variants={stagger}>
              {secondaryTools.map((tool, index) => (
                <React.Fragment key={tool.link}>
                  <SecondaryItem {...tool} />
                  {index < secondaryTools.length - 1 && (
                    <div className="border-b border-border mx-3" />
                  )}
                </React.Fragment>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Utility Links */}
      <motion.div className="grid grid-cols-3 gap-3" variants={stagger}>
        {utilityLinks.map((item) => (
          <motion.div key={item.link} variants={scaleIn} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}>
            <Link to={item.link}>
              <Card className="hover:shadow-md transition-shadow duration-300">
                <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-medium">{item.title}</span>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
