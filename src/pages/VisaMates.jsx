import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { visaMatesAPI } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { countries } from '@/lib/visaData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MessageCircle, UserPlus, Users, Send,
  ArrowLeft, Globe, Calendar, Sparkles,
  Check, X, Loader2, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

const interestOptions = [
  'Culture', 'Food', 'Adventure', 'Photography',
  'Shopping', 'Nature', 'Nightlife', 'History'
];

const toMySQLDate = (d) => new Date(d).toISOString().slice(0, 19).replace('T', ' ');

export default function VisaMates() {
  const { user, isAuthenticated, navigateToLogin } = useAuth();
  const [tab, setTab] = useState('matches');
  const [myProfile, setMyProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState({
    destination_country: '',
    visa_type: '',
    travel_date: '',
    interests: [],
    bio: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const messagesEndRef = useRef(null);
  const lastMessageTimeRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const messagesRef = useRef([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAll();
  }, [isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeChat) {
      pollIntervalRef.current = setInterval(pollNewMessages, 3000);
    }
    return () => clearInterval(pollIntervalRef.current);
  }, [activeChat]);

  const pollNewMessages = async () => {
    if (!activeChat || !lastMessageTimeRef.current) return;
    try {
      const newMsgs = await visaMatesAPI.pollMessages(
        activeChat.id,
        lastMessageTimeRef.current
      );
      if (newMsgs.length > 0) {
        setMessages(prev => [...prev, ...newMsgs]);
        lastMessageTimeRef.current = toMySQLDate(newMsgs[newMsgs.length - 1].created_date);
      }
    } catch {}
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [profile, matchList, connList, reqList] = await Promise.all([
        visaMatesAPI.getMyProfile(),
        visaMatesAPI.getMatches(),
        visaMatesAPI.getConnections(),
        visaMatesAPI.getRequests(),
      ]);
      setMyProfile(profile);
      setMatches(matchList);
      setConnections(connList);
      setRequests(reqList);

      if (profile) {
        setProfileForm({
          destination_country: profile.destination_country || '',
          visa_type: profile.visa_type || '',
          travel_date: profile.travel_date?.slice(0, 10) || '',
          interests: typeof profile.interests === 'string'
            ? JSON.parse(profile.interests)
            : profile.interests || [],
          bio: profile.bio || '',
        });
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await visaMatesAPI.saveProfile(profileForm);
      setShowProfileForm(false);
      loadAll();
    } catch {}
    finally { setSavingProfile(false); }
  };

  const handleConnect = async (userId) => {
    try {
      await visaMatesAPI.connect(userId);
      loadAll();
    } catch (err) {
      console.error('Connect failed:', err);
    }
  };

  const handleRespond = async (id, status) => {
    try {
      await visaMatesAPI.respondConnection(id, status);
      loadAll();
    } catch {}
  };

  const openChat = async (connection) => {
    setActiveChat(connection);
    try {
      const msgs = await visaMatesAPI.getMessages(connection.id);
      setMessages(msgs);
      if (msgs.length > 0) {
        lastMessageTimeRef.current = toMySQLDate(msgs[msgs.length - 1].created_date);
      } else {
        lastMessageTimeRef.current = toMySQLDate(new Date());
      }
    } catch {}
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    setSendingMsg(true);
    const tempMsg = {
      id: Date.now(),
      sender_id: user?.id,
      sender_name: user?.full_name,
      content: newMessage,
      created_date: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    const msgToSend = newMessage;
    setNewMessage('');

    try {
      const saved = await visaMatesAPI.sendMessage(activeChat.id, msgToSend);
      lastMessageTimeRef.current = toMySQLDate(saved.created_date);
      setMessages(prev =>
        prev.map(m => m.id === tempMsg.id ? { ...saved, sender_name: user?.full_name } : m)
      );
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      setNewMessage(msgToSend);
    } finally {
      setSendingMsg(false);
    }
  };

  const toggleInterest = (val) => {
    setProfileForm(p => ({
      ...p,
      interests: p.interests.includes(val)
        ? p.interests.filter(i => i !== val)
        : [...p.interests, val],
    }));
  };

  // ── Not logged in
  if (!isAuthenticated) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Users className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-3">VisaMates</h1>
      <p className="text-muted-foreground mb-6">
        Connect with travelers going to the same destination with the same visa.
      </p>
      <Button className="bg-primary text-white" onClick={navigateToLogin}>
        Sign In to Continue
      </Button>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-secondary" />
    </div>
  );

  // ── Active Chat View
  if (activeChat) return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border shrink-0">
        <button
          onClick={() => {
            setActiveChat(null);
            clearInterval(pollIntervalRef.current);
            loadAll();
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
          {activeChat.other_name?.[0]}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{activeChat.other_name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
            VisaMate
          </p>
        </div>
        <button onClick={pollNewMessages} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No messages yet. Say hi! 👋
          </div>
        )}
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id || i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.sender_id === user?.id
                ? 'bg-primary text-white rounded-tr-sm'
                : 'bg-muted text-foreground rounded-tl-sm'
            }`}>
              <p>{msg.content}</p>
              <p className={`text-xs mt-1 ${
                msg.sender_id === user?.id ? 'text-white/60' : 'text-muted-foreground'
              }`}>
                {format(new Date(msg.created_date), 'h:mm a')}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 shrink-0">
        <Input
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder="Type a message..."
          className="flex-1 rounded-xl h-11"
          disabled={sendingMsg}
        />
        <Button
          onClick={handleSendMessage}
          disabled={sendingMsg || !newMessage.trim()}
          size="icon"
          className="w-11 h-11 bg-primary rounded-xl shrink-0"
        >
          {sendingMsg
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </Button>
      </div>
    </div>
  );

  // ── Main View
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-1">VisaMates</h1>
          <p className="text-muted-foreground">
            Connect with travelers heading to the same destination
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowProfileForm(true)}>
          ✏️ {myProfile ? 'Edit Profile' : 'Set Travel Profile'}
        </Button>
      </div>

      {/* No Profile Warning */}
      {!myProfile && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-8 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="font-medium text-foreground mb-1">
            Set your travel profile to find matches
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Tell us where you're going and what you're interested in.
          </p>
          <Button onClick={() => setShowProfileForm(true)} className="bg-primary text-white">
            Set Travel Profile
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {[
          { id: 'matches', label: '🌍 Matches', count: matches.length },
          { id: 'messages', label: '💬 Messages', count: connections.length },
          { id: 'requests', label: '👋 Requests', count: requests.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── MATCHES TAB ── */}
      {tab === 'matches' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium text-foreground">No matches yet</p>
              <p className="text-sm mt-1">
                Set your travel profile to find people going to the same destination
              </p>
            </div>
          ) : matches.map((match, i) => {
            const country = countries.find(c => c.id === match.destination_country);
            const interests = typeof match.interests === 'string'
              ? JSON.parse(match.interests)
              : match.interests || [];

            return (
              <motion.div
                key={match.user_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {match.full_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{match.full_name}</p>
                        {country && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {country.flag} {country.name}
                          </p>
                        )}
                        {match.visa_type && (
                          <Badge variant="outline" className="text-xs mt-1">{match.visa_type}</Badge>
                        )}
                      </div>
                    </div>

                    {match.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{match.bio}</p>
                    )}

                    {interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {interests.slice(0, 3).map(interest => (
                          <Badge key={interest} className="text-xs bg-secondary/10 text-secondary border-0">
                            {interest}
                          </Badge>
                        ))}
                        {interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{interests.length - 3}</Badge>
                        )}
                      </div>
                    )}

                    {match.travel_date && (
                      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Traveling {format(new Date(match.travel_date), 'MMM yyyy')}
                      </p>
                    )}

                    <div className="mt-auto">
                      {match.connection_status === 'accepted' ? (
                        <Button
                          variant="outline"
                          className="w-full border-emerald-300 text-emerald-600"
                          onClick={() => setTab('messages')}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" /> Chat
                        </Button>
                      ) : match.connection_exists > 0 ? (
                        <Button variant="outline" className="w-full" disabled>
                          <Check className="w-4 h-4 mr-2" /> Request Sent
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleConnect(match.user_id)}
                          className="w-full bg-primary text-white"
                        >
                          <UserPlus className="w-4 h-4 mr-2" /> Connect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── MESSAGES TAB ── */}
      {tab === 'messages' && (
        <div className="space-y-3">
          {connections.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium text-foreground">No conversations yet</p>
              <p className="text-sm mt-1">Connect with a VisaMate to start chatting</p>
            </div>
          ) : connections.map(conn => (
            <Card
              key={conn.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openChat(conn)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">
                  {conn.other_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{conn.other_name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {conn.last_message || 'Tap to start chatting!'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {conn.last_message_time && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(conn.last_message_time), 'h:mm a')}
                    </span>
                  )}
                  {conn.unread_count > 0 && (
                    <span className="w-5 h-5 bg-primary rounded-full text-white text-xs flex items-center justify-center">
                      {conn.unread_count}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === 'requests' && (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium text-foreground">No pending requests</p>
              <p className="text-sm mt-1">When someone wants to connect, it'll show here</p>
            </div>
          ) : requests.map(req => {
            const country = countries.find(c => c.id === req.destination_country);
            return (
              <Card key={req.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white font-bold shrink-0">
                    {req.sender_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{req.sender_name}</p>
                    {country && (
                      <p className="text-sm text-muted-foreground">
                        {country.flag} {country.name} — {req.visa_type}
                      </p>
                    )}
                    {req.bio && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{req.bio}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(req.id, 'accepted')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRespond(req.id, 'rejected')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── PROFILE FORM MODAL ── */}
      <AnimatePresence>
        {showProfileForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowProfileForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-foreground mb-6">Your Travel Profile</h2>
              <div className="space-y-4">
                <div>
                  <Label>Destination Country</Label>
                  <Select
                    value={profileForm.destination_country}
                    onValueChange={v => setProfileForm(p => ({ ...p, destination_country: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Where are you going?" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Visa Type</Label>
                  <Select
                    value={profileForm.visa_type}
                    onValueChange={v => setProfileForm(p => ({ ...p, visa_type: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select visa type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tourist Visa">✈️ Tourist Visa</SelectItem>
                      <SelectItem value="Student Visa">🎓 Student Visa</SelectItem>
                      <SelectItem value="Work Visa">💼 Work Visa</SelectItem>
                      <SelectItem value="Business Visa">🏢 Business Visa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Travel Date</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={profileForm.travel_date}
                    onChange={e => setProfileForm(p => ({ ...p, travel_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Your Interests</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interestOptions.map(interest => (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          profileForm.interests.includes(interest)
                            ? 'bg-secondary text-white border-secondary'
                            : 'border-border text-foreground hover:border-secondary'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Bio (optional)</Label>
                  <textarea
                    value={profileForm.bio}
                    onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell others about yourself and your travel plans..."
                    className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowProfileForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex-1 bg-primary text-white"
                  >
                    {savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Profile
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}