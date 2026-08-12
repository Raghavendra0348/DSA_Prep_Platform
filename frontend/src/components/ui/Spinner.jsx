import { Loader2 } from 'lucide-react';
import './Spinner.css';

export default function Spinner({ size = 20 }) {
  return <Loader2 className="spinner" size={size} />;
}
