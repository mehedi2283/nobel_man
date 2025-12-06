import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Heart, Send, User, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Project, Comment } from '../types';
import Footer from './Footer';
import Contact from './Contact';
import { projectService } from '../services/projectService';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onProjectUpdate: (project: Project) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project: initialProject, onBack, onProjectUpdate }) => {
  const [project, setProject] = useState<Project>(initialProject);
  const [likes, setLikes] = useState(initialProject.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [mainImgLoaded, setMainImgLoaded] = useState(false);
  
  // Comment State
  const [comments, setComments] = useState<Comment[]>(initialProject.comments || []);
  const [newCommentAuthor, setNewCommentAuthor] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Sync state if prop changes (e.g. from parent update)
  useEffect(() => {
    setProject(initialProject);
    setLikes(initialProject.likes || 0);
    setComments(initialProject.comments || []);
  }, [initialProject]);

  // Check local storage for like status
  useEffect(() => {
    const liked = localStorage.getItem(`liked_${project.id}`);
    if (liked) setIsLiked(true);
  }, [project.id]);

  const handleLike = async () => {
    if (isLiked) return;

    const newLikes = (likes || 0) + 1;
    setIsLiked(true);
    setLikes(newLikes);
    localStorage.setItem(`liked_${project.id}`, 'true');
    
    const updatedProject = { ...project, likes: newLikes };
    setProject(updatedProject);
    onProjectUpdate(updatedProject); // Update global state

    try {
        await projectService.likeProject(project.id);
    } catch (error) {
        console.error("Failed to like project");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentAuthor.trim() || !newCommentText.trim()) return;

    setSubmitStatus('loading');
    
    // Optimistic Update
    const tempComment: Comment = {
        id: Date.now().toString(),
        author: newCommentAuthor,
        text: newCommentText,
        createdAt: new Date().toISOString()
    };
    
    // Append to list (we reverse it in render)
    const newComments = [...comments, tempComment];
    
    try {
        const updatedProjectServer = await projectService.addComment(project.id, {
            author: tempComment.author,
            text: tempComment.text
        });
        
        // Success
        setComments(updatedProjectServer.comments || newComments);
        setProject(updatedProjectServer);
        onProjectUpdate(updatedProjectServer);
        
        setNewCommentAuthor('');
        setNewCommentText('');
        setSubmitStatus('success');
        
        // Reset status after delay
        setTimeout(() => setSubmitStatus('idle'), 3000);
        
    } catch (error) {
        console.error("Failed to post comment", error);
        alert("Failed to post comment. Please try again.");
        setSubmitStatus('idle');
    }
  };

  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Prepare display comments (reversed)
  const displayComments = comments.slice().reverse();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white"
    >
      {/* Navigation */}
      <div className="sticky top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-6 md:px-16 py-6 flex justify-between items-center">
            <button 
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors font-medium group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Projects
            </button>
            
            {/* Header Interaction Stats */}
             <div className="flex items-center gap-6">
                <button 
                    onClick={handleLike}
                    disabled={isLiked}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                        isLiked 
                        ? 'bg-red-50 border-red-200 text-red-500' 
                        : 'bg-white border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500'
                    }`}
                >
                    <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                    <span className="font-medium">{likes}</span>
                </button>
            </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-6 md:px-16 pt-12">
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            <span className="text-gray-500 font-medium tracking-wide uppercase text-sm mb-4 block">{project.category}</span>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-12">{project.title}</h1>
        </motion.div>

        <motion.div
             initial={{ scale: 0.98, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="w-full aspect-video bg-gray-100 rounded-none overflow-hidden mb-16 group shadow-sm"
        >
            <img 
                src={project.image} 
                alt={project.title}
                onLoad={() => setMainImgLoaded(true)}
                className={`w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 
                  ${mainImgLoaded ? 'blur-0 opacity-100' : 'blur-xl opacity-0'}
                `}
                loading="lazy"
                decoding="async"
            />
        </motion.div>

        {/* Project Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-24">
            <div className="lg:col-span-4 space-y-8">
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Role</h3>
                    <p className="text-gray-600">{project.role || 'Designer'}</p>
                </div>
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Client</h3>
                    <p className="text-gray-600">{project.client || 'Confidential'}</p>
                </div>
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Year</h3>
                    <p className="text-gray-600">{project.year || '2023'}</p>
                </div>
            </div>

            <div className="lg:col-span-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">About the project</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    {project.description}
                </p>
            </div>
        </div>

        {/* Stacked Gallery Carousel */}
        {project.gallery && project.gallery.length > 0 && (
          <div className="pb-32 overflow-hidden">
             <div className="mb-12">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Gallery</h2>
                <p className="text-gray-500 text-sm">Swiping stack gallery</p>
             </div>
             
             <StackedCarousel 
                items={project.gallery}
                heightClass="h-[250px] md:h-[400px]"
                cardWidthClass="w-[240px] md:w-[500px]"
                renderItem={(img) => (
                    <img 
                        src={img} 
                        alt="Gallery" 
                        className="w-full h-full object-cover rounded-2xl pointer-events-none select-none"
                    />
                )}
             />
          </div>
        )}

        {/* Comments Section */}
        <div className="pb-32">
            <div className="border-t border-gray-200 pt-16">
                
                <div className="max-w-4xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                        Comments <span className="text-gray-400 text-xl font-normal">({comments.length})</span>
                    </h2>
                    
                    {/* Comment Form */}
                    <div className="bg-gray-50 p-6 md:p-8 rounded-xl border border-gray-100 mb-12">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Leave your thought</h3>
                        <form onSubmit={handleCommentSubmit} className="space-y-4">
                            <div>
                                <input 
                                    type="text" 
                                    placeholder="Your Name" 
                                    value={newCommentAuthor}
                                    onChange={(e) => setNewCommentAuthor(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <textarea 
                                    placeholder="What do you think about this project?" 
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all resize-none"
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <motion.button 
                                    type="submit" 
                                    disabled={submitStatus === 'loading'}
                                    className="bg-black text-white h-12 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-100 min-w-[140px]"
                                    layout
                                >
                                    <AnimatePresence mode="popLayout" initial={false}>
                                        {submitStatus === 'idle' && (
                                            <motion.div
                                                key="idle"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex items-center gap-2"
                                            >
                                                <span>Post</span>
                                                <Send size={16} />
                                            </motion.div>
                                        )}
                                        {submitStatus === 'loading' && (
                                            <motion.div
                                                key="loading"
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.5 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex items-center gap-2"
                                            >
                                                <span>Posting</span>
                                                <Loader2 size={16} className="animate-spin" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Stacked Comments Carousel */}
                {comments.length > 0 ? (
                    <div className="overflow-hidden py-10">
                         <div className="mb-6 text-center md:text-left container mx-auto px-4 max-w-4xl">
                            <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">Community Thoughts</p>
                         </div>
                         <StackedCarousel
                            items={displayComments}
                            autoPlay={true}
                            interval={3500}
                            heightClass="h-[250px] md:h-[400px]"
                            cardWidthClass="w-[240px] md:w-[500px]"
                            renderItem={(comment) => (
                                <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-2xl h-full flex flex-col justify-between select-none">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                                                {comment.author ? comment.author.charAt(0).toUpperCase() : <User size={18} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm truncate">{comment.author}</h4>
                                                <span className="text-[10px] text-gray-400 block uppercase tracking-wide">{formatDate(comment.createdAt)}</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-4 italic">
                                            "{comment.text}"
                                        </p>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <div className="w-8 h-1 bg-gray-100 rounded-full" />
                                    </div>
                                </div>
                            )}
                         />
                    </div>
                ) : (
                    <p className="text-gray-500 text-center italic py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 max-w-2xl mx-auto">
                        No comments yet. Be the first to share your thoughts!
                    </p>
                )}
            </div>
        </div>

      </div>
      
      <Contact />
      <Footer />
    </motion.div>
  );
};

// --- Generic Stacked Carousel Component ---

interface StackedCarouselProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  autoPlay?: boolean;
  interval?: number;
  heightClass?: string;
  cardWidthClass?: string;
}

const StackedCarousel = <T,>({ 
    items, 
    renderItem, 
    autoPlay = true, 
    interval = 3000,
    heightClass = "h-[400px]",
    cardWidthClass = "w-[300px] md:w-[500px]"
}: StackedCarouselProps<T>) => {
    const [index, setIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Memoize nextImage to avoid dependency cycles
    const nextImage = useCallback(() => {
        setIndex((prev) => (prev + 1) % items.length);
    }, [items.length]);

    const prevImage = useCallback(() => {
        setIndex((prev) => (prev - 1 + items.length) % items.length);
    }, [items.length]);

    // Auto-slide effect
    useEffect(() => {
        if (!autoPlay || isHovered || items.length <= 1) return;
        const timer = setInterval(() => {
            nextImage();
        }, interval);
        return () => clearInterval(timer);
    }, [autoPlay, interval, isHovered, items.length, nextImage]);

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.x < -50) {
            nextImage();
        } else if (info.offset.x > 50) {
            prevImage();
        }
    };

    // Calculate card styles based on circular distance
    const getCardStyle = (itemIndex: number) => {
        const length = items.length;
        // Calculate shortest distance in a circle
        let diff = itemIndex - index;
        if (diff > length / 2) diff -= length;
        if (diff < -length / 2) diff += length;

        const isCenter = diff === 0;
        const absDiff = Math.abs(diff);
        
        // Only render active + 1 neighbor on each side + 1 buffer (total 5 visible max)
        const isVisible = absDiff <= 2; 

        // Scale & Z-Index
        // Center: 1, Neighbors: 0.9, Far: 0.8
        const scale = 1 - (absDiff * 0.1); 
        const zIndex = 10 - absDiff;
        
        // Opacity
        const opacity = isVisible ? (1 - absDiff * 0.3) : 0;
        
        // X Position (Overlap Logic)
        // Adjust overlap percentage based on screen size via CSS classes logic or fixed here
        // We use percentage of 100% (where 100% is card width)
        // 15% overlap for neighbors
        const xPercent = diff * 15; 

        return {
            x: `${xPercent}%`,
            scale,
            zIndex,
            opacity,
            display: isVisible ? 'block' : 'none',
        };
    };

    if (!items || items.length === 0) return null;

    // If single item, render static
    if (items.length === 1) {
        return (
            <div className={`relative w-full flex items-center justify-center ${heightClass}`}>
                 <div className={`relative ${cardWidthClass} h-full`}>
                    {renderItem(items[0])}
                 </div>
            </div>
        );
    }

    return (
        <div 
            className={`relative w-full flex items-center justify-center perspective-1000 ${heightClass}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={() => setIsHovered(true)}
            onTouchEnd={() => setIsHovered(false)}
        >
            {/* Cards Container */}
            <div className={`relative ${cardWidthClass} h-full flex items-center justify-center`}>
                <AnimatePresence initial={false} mode="popLayout">
                    {items.map((item, i) => {
                        const style = getCardStyle(i);
                        return (
                            <motion.div
                                key={i}
                                className="absolute w-full h-full origin-center cursor-grab active:cursor-grabbing will-change-transform"
                                animate={{
                                    x: style.x,
                                    scale: style.scale,
                                    zIndex: style.zIndex,
                                    opacity: style.opacity,
                                    display: style.display,
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.05}
                                onDragEnd={handleDragEnd}
                                onClick={() => {
                                    if (i !== index) setIndex(i);
                                }}
                            >
                                <div className="w-full h-full relative bg-white rounded-2xl overflow-hidden border border-gray-100">
                                    {renderItem(item)}
                                    
                                    {/* Overlay for non-active cards to simulate depth */}
                                    {i !== index && (
                                        <div className="absolute inset-0 bg-white/70 transition-colors pointer-events-none rounded-2xl" />
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Navigation Buttons (Desktop) */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-20 pointer-events-none">
                <button 
                    onClick={prevImage}
                    className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform text-gray-800 border border-gray-100"
                >
                    <ChevronLeft size={24} />
                </button>
                <button 
                    onClick={nextImage}
                    className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform text-gray-800 border border-gray-100"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Pagination Dots */}
            <div className="absolute -bottom-6 flex gap-2 justify-center">
                {items.map((_, i) => (
                    <button 
                        key={i} 
                        onClick={() => setIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-black w-6' : 'bg-gray-300 w-1.5 hover:bg-gray-400'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProjectDetail;