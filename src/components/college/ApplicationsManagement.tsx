
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { User, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';

type Application = {
  id: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  student: {
    id: string;
    profile: {
      full_name: string;
    };
  };
  course: {
    name: string;
  };
  test_result?: {
    score: number;
  } | null;
};

const ApplicationsManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [currentApplication, setCurrentApplication] = useState<Application | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        // Get college id
        const { data: collegeData, error: collegeError } = await supabase
          .from('colleges')
          .select('id')
          .eq('profile_id', session.user.id)
          .single();
          
        if (collegeError) throw collegeError;
        
        setCollegeId(collegeData.id);
        
        await fetchApplications(collegeData.id);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  const fetchApplications = async (collegeId: string) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id, 
          status, 
          notes, 
          created_at, 
          updated_at,
          courses!inner(
            name,
            college_id
          ),
          students!inner(
            id,
            profiles!inner(
              full_name
            )
          ),
          test_results(
            score
          )
        `)
        .eq('courses.college_id', collegeId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Format the data
      const formattedApplications = data.map((app: any) => ({
        id: app.id,
        status: app.status,
        notes: app.notes,
        created_at: app.created_at,
        updated_at: app.updated_at,
        student: {
          id: app.students.id,
          profile: {
            full_name: app.students.profiles.full_name
          }
        },
        course: {
          name: app.courses.name
        },
        test_result: app.test_results.length > 0 ? app.test_results[0] : null
      }));
      
      setApplications(formattedApplications);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive'
      });
    }
  };
  
  const handleViewApplication = (application: Application) => {
    setCurrentApplication(application);
    setFormData({
      status: application.status,
      notes: application.notes || ''
    });
    setIsDialogOpen(true);
  };
  
  const handleStatusChange = (value: string) => {
    setFormData(prev => ({ ...prev, status: value }));
  };
  
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, notes: e.target.value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentApplication) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: formData.status,
          notes: formData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentApplication.id);
        
      if (error) throw error;
      
      toast({
        title: 'Application updated',
        description: 'Application status has been successfully updated'
      });
      
      // Refresh applications
      if (collegeId) {
        await fetchApplications(collegeId);
      }
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error updating application:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
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

  if (loading && !collegeId) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Student Applications</h3>
      
      {applications.length === 0 ? (
        <div className="text-center p-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">No applications received yet</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Test Score</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map(application => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-purple-500" />
                      {application.student.profile.full_name}
                    </div>
                  </TableCell>
                  <TableCell>{application.course.name}</TableCell>
                  <TableCell>
                    {application.test_result 
                      ? `${application.test_result.score}%` 
                      : 'No test taken'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(application.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewApplication(application)}
                    >
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Update status and provide feedback for this application
            </DialogDescription>
          </DialogHeader>
          {currentApplication && (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Student</p>
                    <p>{currentApplication.student.profile.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Course</p>
                    <p>{currentApplication.course.name}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Test Score</p>
                    <p>
                      {currentApplication.test_result 
                        ? `${currentApplication.test_result.score}%` 
                        : 'No test taken'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Date Applied</p>
                    <p>{format(new Date(currentApplication.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
                
                <div className="space-y-2 pt-2">
                  <label htmlFor="status" className="text-sm font-medium">Status</label>
                  <Select 
                    value={formData.status} 
                    onValueChange={handleStatusChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="waitlisted">Waitlisted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                  <Textarea 
                    id="notes"
                    value={formData.notes}
                    onChange={handleNotesChange}
                    placeholder="Add notes or feedback for this application"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Update Application'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsManagement;
