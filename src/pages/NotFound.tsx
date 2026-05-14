import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const NotFound = () => {

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <div className="text-8xl font-extrabold text-gradient-primary">404</div>
        <h1 className="text-2xl font-bold text-foreground">העמוד לא נמצא</h1>
        <p className="text-muted-foreground text-lg">אולי הוא עבר דירה...</p>
        <Button asChild size="lg" className="mt-4">
          <Link to="/" className="gap-2">
            <Home className="w-4 h-4" />
            חזרה לדף הבית
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFound;
