'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function PromoteMe() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const promote = async () => {
        if (!user) {
            toast.error('Please login first');
            return;
        }

        setLoading(true);
        try {
            // We'll call a bypass endpoint or just hit the admin endpoint if we can
            // Since we haven't implemented a bypass, let's suggest the user how to do it via MongoDB 
            // OR I can quickly add a bypass in the backend.

            toast.loading('Attempting promotion...');

            // Backend change needed for this to work.
            // For now, I'll just show the MongoDB command.

        } catch (error) {
            toast.error('Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
            <h1 className="text-4xl font-bold mb-4">Admin Promotion Tool</h1>
            <p className="text-slate-400 mb-8 max-w-md">
                To access the Admin Dashboard, execute this command in your MongoDB shell or Compass:
            </p>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 font-mono text-blue-400 text-left w-full max-w-2xl overflow-x-auto mb-8">
                db.users.updateOne(<br />
                &nbsp;&nbsp;{'{'} "email": "{user?.email || 'YOUR_EMAIL'}" {'}'},<br />
                &nbsp;&nbsp;{'{'} "$set": {'{'} "role": "admin" {'}'} {'}'}<br />
                )
            </div>

            <p className="text-sm text-red-400">
                After running the command, log out and log back in (or refresh).
            </p>
        </div>
    );
}
