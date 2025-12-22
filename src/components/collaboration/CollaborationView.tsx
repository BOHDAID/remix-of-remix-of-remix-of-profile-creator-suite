import { useState } from 'react';
import { 
  Users2, 
  UserPlus, 
  Settings2, 
  Share2, 
  MessageSquare,
  Crown,
  Shield,
  Eye,
  Edit,
  Trash2,
  Send,
  Circle,
  Check,
  X,
  Clock,
  Activity,
  Link2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

interface SharedProfile {
  id: string;
  profileId: string;
  profileName: string;
  sharedBy: string;
  sharedWith: string[];
  permission: 'view' | 'launch' | 'edit' | 'full';
  createdAt: Date;
}

interface TeamActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  content: string;
  timestamp: Date;
}

export function CollaborationView() {
  const { isRTL } = useTranslation();
  const { profiles } = useAppStore();
  const [activeTab, setActiveTab] = useState('team');

  const [teamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'أحمد محمد', email: 'ahmed@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', role: 'owner', status: 'online', lastSeen: new Date() },
    { id: '2', name: 'سارة علي', email: 'sara@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara', role: 'admin', status: 'online', lastSeen: new Date() },
    { id: '3', name: 'محمد خالد', email: 'mohamed@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohamed', role: 'member', status: 'away', lastSeen: new Date(Date.now() - 600000) },
    { id: '4', name: 'فاطمة أحمد', email: 'fatima@example.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima', role: 'viewer', status: 'offline', lastSeen: new Date(Date.now() - 3600000) },
  ]);

  const [sharedProfiles] = useState<SharedProfile[]>([
    { id: '1', profileId: '1', profileName: 'Facebook Marketing', sharedBy: 'أحمد محمد', sharedWith: ['سارة علي', 'محمد خالد'], permission: 'launch', createdAt: new Date() },
    { id: '2', profileId: '2', profileName: 'Amazon Shopping', sharedBy: 'سارة علي', sharedWith: ['أحمد محمد'], permission: 'full', createdAt: new Date() },
  ]);

  const [activities] = useState<TeamActivity[]>([
    { id: '1', userId: '1', userName: 'أحمد محمد', action: 'launched', target: 'Facebook Marketing', timestamp: new Date() },
    { id: '2', userId: '2', userName: 'سارة علي', action: 'edited', target: 'Amazon Shopping', timestamp: new Date(Date.now() - 300000) },
    { id: '3', userId: '3', userName: 'محمد خالد', action: 'stopped', target: 'Twitter Automation', timestamp: new Date(Date.now() - 600000) },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', userId: '1', userName: 'أحمد محمد', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed', content: 'مرحباً بالجميع! هل البروفايل الجديد جاهز؟', timestamp: new Date(Date.now() - 600000) },
    { id: '2', userId: '2', userName: 'سارة علي', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara', content: 'نعم، تم إعداده وجاهز للاستخدام 👍', timestamp: new Date(Date.now() - 300000) },
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      userId: '1',
      userName: 'أحمد محمد',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
      content: newMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const inviteMember = () => {
    if (!inviteEmail) {
      toast.error(isRTL ? 'أدخل البريد الإلكتروني' : 'Enter email address');
      return;
    }
    toast.success(isRTL ? 'تم إرسال الدعوة' : 'Invitation sent');
    setShowInvite(false);
    setInviteEmail('');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'member': return <Edit className="w-4 h-4 text-green-500" />;
      case 'viewer': return <Eye className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const labels = {
      owner: isRTL ? 'مالك' : 'Owner',
      admin: isRTL ? 'مدير' : 'Admin',
      member: isRTL ? 'عضو' : 'Member',
      viewer: isRTL ? 'مشاهد' : 'Viewer'
    };
    return labels[role as keyof typeof labels];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Users2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isRTL ? 'التعاون الجماعي' : 'Team Collaboration'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? 'العمل الجماعي ومشاركة البروفايلات' : 'Teamwork and profile sharing'}
            </p>
          </div>
        </div>
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              {isRTL ? 'دعوة عضو' : 'Invite Member'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRTL ? 'دعوة عضو جديد' : 'Invite New Member'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
                <Input 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{isRTL ? 'الدور' : 'Role'}</label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{isRTL ? 'مدير' : 'Admin'}</SelectItem>
                    <SelectItem value="member">{isRTL ? 'عضو' : 'Member'}</SelectItem>
                    <SelectItem value="viewer">{isRTL ? 'مشاهد' : 'Viewer'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvite(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={inviteMember}>{isRTL ? 'إرسال الدعوة' : 'Send Invite'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Online Members */}
      <div className="flex items-center gap-4">
        <div className="flex -space-x-3 rtl:space-x-reverse">
          {teamMembers.filter(m => m.status === 'online').slice(0, 5).map((member) => (
            <Avatar key={member.id} className="border-2 border-background w-10 h-10">
              <AvatarImage src={member.avatar} />
              <AvatarFallback>{member.name[0]}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {teamMembers.filter(m => m.status === 'online').length} {isRTL ? 'متصلون الآن' : 'online now'}
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card">
          <TabsTrigger value="team">{isRTL ? 'الفريق' : 'Team'}</TabsTrigger>
          <TabsTrigger value="shared">{isRTL ? 'مشترك' : 'Shared'}</TabsTrigger>
          <TabsTrigger value="activity">{isRTL ? 'النشاط' : 'Activity'}</TabsTrigger>
          <TabsTrigger value="chat">{isRTL ? 'المحادثة' : 'Chat'}</TabsTrigger>
        </TabsList>

        {/* Team Members */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'أعضاء الفريق' : 'Team Members'}</CardTitle>
              <CardDescription>
                {teamMembers.length} {isRTL ? 'أعضاء' : 'members'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div 
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                          member.status === 'online' && "bg-green-500",
                          member.status === 'away' && "bg-yellow-500",
                          member.status === 'offline' && "bg-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{getRoleBadge(member.role)}</Badge>
                      {member.role !== 'owner' && (
                        <Button variant="ghost" size="icon">
                          <Settings2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shared Profiles */}
        <TabsContent value="shared" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'البروفايلات المشتركة' : 'Shared Profiles'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sharedProfiles.map((share) => (
                  <div 
                    key={share.id}
                    className="p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Share2 className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">{share.profileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {isRTL ? 'بواسطة' : 'by'} {share.sharedBy}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{share.permission}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{isRTL ? 'مشترك مع:' : 'Shared with:'}</span>
                      {share.sharedWith.map((user, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{user}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                {isRTL ? 'نشاط الفريق' : 'Team Activity'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName}</span>
                        {' '}{activity.action}{' '}
                        <span className="text-primary">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[500px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {isRTL ? 'محادثة الفريق' : 'Team Chat'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={msg.avatar} />
                        <AvatarFallback>{msg.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{msg.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg inline-block">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
