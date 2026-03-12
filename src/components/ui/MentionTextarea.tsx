import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MentionList } from './MentionList';

import { Plus, Smile } from 'lucide-react';

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onMention?: (userId: string) => void;
  onEmoji?: (emoji: string) => void;
}

export function MentionTextarea({ onMention, onEmoji, ...props }: MentionTextareaProps) {
  const { users } = useApp();
  const [showMentions, setShowMentions] = useState(false);
  const [query, setQuery] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionListRef = useRef<any>(null);

  const EMOJIS = ['👍', '❤️', '🔥', '👏', '✅', '🙌', '🚀', '⭐'];

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && mentionListRef.current) {
      const handled = mentionListRef.current.onKeyDown({ event: e.nativeEvent });
      if (handled) {
        e.preventDefault();
        return;
      }
    }
    
    if (props.onKeyDown) props.onKeyDown(e);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setCursorPos(pos);

    const textBefore = value.substring(0, pos);
    // Match @ followed by word characters at the end of the string
    const mentionMatch = textBefore.match(/@(\w*)$/);

    if (mentionMatch) {
      setShowMentions(true);
      setQuery(mentionMatch[1]);
    } else {
      setShowMentions(false);
    }

    if (props.onChange) props.onChange(e);
  };

  const addEmoji = (emoji: string) => {
    if (!textareaRef.current) return;
    const value = textareaRef.current.value;
    const pos = textareaRef.current.selectionStart;
    const newValue = value.substring(0, pos) + emoji + value.substring(pos);
    
    const event = {
      target: { value: newValue }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    if (props.onChange) props.onChange(event);
    if (onEmoji) onEmoji(emoji);
    textareaRef.current.focus();
  };

  const insertMention = (user: { id: string; label: string }) => {
    if (!textareaRef.current) return;
    const value = textareaRef.current.value;
    const textBefore = value.substring(0, cursorPos).replace(/@(\w*)$/, `@${user.label} `);
    const textAfter = value.substring(cursorPos);
    
    const newValue = textBefore + textAfter;
    
    // Create a synthetic event
    const event = {
      target: { value: newValue }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    if (props.onChange) props.onChange(event);
    if (onMention) onMention(user.id);
    
    setShowMentions(false);
    textareaRef.current.focus();
  };

  return (
    <div className="relative w-full">
      <textarea
        {...props}
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        onChange={handleInput}
      />
      {showMentions && (
        <div className="absolute z-[100] bottom-full left-0 mb-2 w-64">
          <MentionList 
            ref={mentionListRef}
            items={filteredUsers} 
            command={insertMention} 
          />
        </div>
      )}
      <div className="absolute right-2 bottom-2 flex items-center gap-1">
        {showEmojis && (
          <div className="absolute bottom-full right-0 mb-2 p-2 bg-white rounded-xl shadow-xl border border-gray-200 flex gap-1 animate-in fade-in zoom-in-95 duration-100">
            {EMOJIS.map(e => (
              <button
                key={e}
                type="button"
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors text-[18px]"
                onClick={() => { addEmoji(e); setShowEmojis(false); }}
              >
                {e}
              </button>
            ))}
          </div>
        )}
        <button 
          type="button"
          className={`p-1.5 rounded-lg transition-colors ${showEmojis ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
          onClick={() => setShowEmojis(!showEmojis)}
          title="Add Emoji"
        >
          <Smile size={16} />
        </button>
      </div>
    </div>
  );
}
