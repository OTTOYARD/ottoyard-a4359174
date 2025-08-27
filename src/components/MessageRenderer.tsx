import { memo } from "react";

interface MessageRendererProps {
  content: string;
  role: 'user' | 'assistant';
}

const MessageRenderer = memo(({ content, role }: MessageRendererProps) => {
  // Enhanced message formatting with proper headings, bullets, and spacing
  const formatMessage = (text: string) => {
    // Split into paragraphs and process each one
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return null;

      // Check for headings (text ending with :)
      if (trimmed.endsWith(':') && trimmed.length < 60 && !trimmed.includes('\n')) {
        return (
          <h3 key={index} className="text-base font-semibold text-foreground mb-2 mt-3 first:mt-0">
            {trimmed}
          </h3>
        );
      }

      // Check for numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split(/\n(?=\d+\.\s)/);
        return (
          <ol key={index} className="list-decimal list-inside space-y-1 mb-3 ml-2">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-sm leading-relaxed">
                {item.replace(/^\d+\.\s/, '')}
              </li>
            ))}
          </ol>
        );
      }

      // Check for bullet points
      if (/^[•\-\*]\s/.test(trimmed) || trimmed.includes('\n• ')) {
        const items = trimmed.split(/\n(?=[•\-\*]\s)/).filter(item => item.trim());
        return (
          <ul key={index} className="list-none space-y-1 mb-3">
            {items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-sm leading-relaxed flex items-start">
                <span className="text-primary mr-2 mt-0.5 text-xs">•</span>
                <span>{item.replace(/^[•\-\*]\s/, '')}</span>
              </li>
            ))}
          </ul>
        );
      }

      // Regular paragraph with enhanced formatting
      const lines = trimmed.split('\n');
      return (
        <div key={index} className="mb-3 last:mb-0">
          {lines.map((line, lineIndex) => {
            if (!line.trim()) return <br key={lineIndex} />;
            
            // Bold text formatting
            const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-medium text-foreground">$1</strong>');
            
            return (
              <p 
                key={lineIndex} 
                className="text-sm leading-relaxed mb-1 last:mb-0"
                dangerouslySetInnerHTML={{ __html: formattedLine }}
              />
            );
          })}
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <div className={`space-y-1 ${role === 'assistant' ? 'text-muted-foreground' : 'text-primary-foreground'}`}>
      {formatMessage(content)}
    </div>
  );
});

MessageRenderer.displayName = 'MessageRenderer';

export { MessageRenderer };