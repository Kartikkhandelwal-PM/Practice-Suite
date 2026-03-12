import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { User } from '../../types';
import { Avatar } from './Avatar';

export interface MentionListProps {
  items: User[];
  command: (props: { id: string; label: string }) => void;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.name });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden min-w-[200px] animate-in fade-in zoom-in-95 duration-100">
      {props.items.length > 0 ? (
        <div className="p-1">
          {props.items.map((item, index) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => selectItem(index)}
            >
              <Avatar user={item} size={24} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold truncate">{item.name}</div>
                <div className="text-[11px] text-gray-400 truncate">{item.role}</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-400 text-[12px]">No users found</div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';
