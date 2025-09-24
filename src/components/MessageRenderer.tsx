import { memo } from "react";

interface MessageRendererProps {
  content: string;
  role: 'user' | 'assistant';
}

const MessageRenderer = memo(({ content, role }: MessageRendererProps) => {
  // Enhanced message formatting with proper headings, bullets, and spacing
  const formatMessage = (text: string) => {
    // First, split by double line breaks to get main sections
    const sections = text.split(/\n\s*\n/);
    
    return sections.map((section, sectionIndex) => {
      const trimmed = section.trim();
      if (!trimmed) return null;

      // Check for section headings (text ending with : and potentially on its own line)
      const headingMatch = trimmed.match(/^([^:\n]+:)\s*$/m);
      if (headingMatch || (trimmed.endsWith(':') && trimmed.length < 80 && !trimmed.includes('\n'))) {
        const headingText = headingMatch ? headingMatch[1] : trimmed;
        const remainingText = headingMatch ? trimmed.replace(headingMatch[0], '').trim() : '';
        
        return (
          <div key={sectionIndex} className="mb-4">
            <h3 className="text-lg font-bold text-primary mb-3 mt-4 first:mt-0 border-b border-border/30 pb-1">
              {headingText}
            </h3>
            {remainingText && (
              <div className="ml-2">
                {formatContent(remainingText)}
              </div>
            )}
          </div>
        );
      }

      return (
        <div key={sectionIndex} className="mb-3">
          {formatContent(trimmed)}
        </div>
      );
    }).filter(Boolean);
  };

  const formatContent = (text: string) => {
    // Check for numbered lists (handle multi-line numbered items)
    if (/^\d+\.\s/.test(text)) {
      // Split by lines and filter for numbered items
      const lines = text.split('\n');
      const numberedItems = [];
      let currentItem = '';
      
      for (const line of lines) {
        if (/^\d+\.\s/.test(line.trim())) {
          // Start of a new numbered item
          if (currentItem) numberedItems.push(currentItem.trim());
          currentItem = line.replace(/^\d+\.\s/, '').trim();
        } else if (line.trim() && currentItem) {
          // Continuation of current item
          currentItem += ' ' + line.trim();
        } else if (line.trim()) {
          // Standalone line, treat as new item
          currentItem = line.trim();
        }
      }
      if (currentItem) numberedItems.push(currentItem.trim());
      
      return (
        <ol className="list-none space-y-2 mb-3">
          {numberedItems.map((item, itemIndex) => {
            const formattedItem = item.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
            return (
              <li key={itemIndex} className="text-sm leading-relaxed flex items-start">
                <span className="text-primary font-medium mr-3 mt-0.5 min-w-[1.5rem]">
                  {itemIndex + 1}.
                </span>
                <div 
                  className="flex-1"
                  dangerouslySetInnerHTML={{ __html: formattedItem }}
                />
              </li>
            );
          })}
        </ol>
      );
    }

    // Check for bullet points
    if (/^[•\-\*]\s/.test(text) || text.includes('\n• ') || text.includes('\n- ') || text.includes('\n* ')) {
      const items = text.split(/\n(?=[•\-\*]\s)/).filter(item => item.trim());
      return (
        <ul className="list-none space-y-2 mb-3">
          {items.map((item, itemIndex) => {
            const cleanItem = item.replace(/^[•\-\*]\s/, '').trim();
            const formattedItem = cleanItem.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
            return (
              <li key={itemIndex} className="text-sm leading-relaxed flex items-start">
                <span className="text-primary mr-3 mt-1 text-xs">•</span>
                <div 
                  className="flex-1"
                  dangerouslySetInnerHTML={{ __html: formattedItem }}
                />
              </li>
            );
          })}
        </ul>
      );
    }

    // Regular paragraph text
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map((line, lineIndex) => {
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
      return (
        <p 
          key={lineIndex} 
          className="text-sm leading-relaxed mb-2 last:mb-0"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <div className={`space-y-1 ${role === 'assistant' ? 'text-muted-foreground' : 'text-primary-foreground'}`}>
      {formatMessage(content)}
    </div>
  );
});

MessageRenderer.displayName = 'MessageRenderer';

export { MessageRenderer };