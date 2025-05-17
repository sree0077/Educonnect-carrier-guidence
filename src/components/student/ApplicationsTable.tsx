
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FilePenLine,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';

type Application = {
  id: string;
  status: string;
  created_at: string;
  college: {
    name: string;
  };
  course: {
    name: string;
  };
};

const ApplicationsTable = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        // Get student id
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('profile_id', session.user.id)
          .single();
          
        if (studentError) throw studentError;
        
        // Get applications with course and college data
        const { data, error } = await supabase
          .from('applications')
          .select(`
            id, 
            status, 
            created_at, 
            courses!inner(
              name, 
              colleges!inner(name)
            )
          `)
          .eq('student_id', studentData.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Format the data
        const formattedApplications = data.map((app: any) => ({
          id: app.id,
          status: app.status,
          created_at: app.created_at,
          course: {
            name: app.courses.name
          },
          college: {
            name: app.courses.colleges.name
          }
        }));
        
        setApplications(formattedApplications);
      } catch (error: any) {
        console.error('Error fetching applications:', error);
        toast({
          title: 'Error',
          description: 'Failed to load applications',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, [toast]);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Your Applications</h3>
        <Button variant="outline" size="sm">
          <FilePenLine className="mr-2 h-4 w-4" />
          New Application
        </Button>
      </div>
      
      {applications.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">You haven't submitted any applications yet</p>
          <Button className="mt-4">
            Browse Colleges
          </Button>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>College</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Submitted On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map(application => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">{application.college.name}</TableCell>
                  <TableCell>{application.course.name}</TableCell>
                  <TableCell>
                    {format(new Date(application.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ApplicationsTable;
