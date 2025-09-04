import React, { useState } from 'react'
import { useKV } from '@/hooks/useAzureData'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Copy, CheckCircle, AlertCircle, History, Search, Trash2, Calendar, Zap } from 'lucide-react'
import { toast } from 'sonner'

type Platform = 'linkedin' | 'instagram' | 'twitter' | 'facebook'

interface PlatformConfig {
  name: string
  color: string
  maxLength: number
  icon: string
}

interface SavedGeneration {
  id: string
  timestamp: number
  content: string
  isUrl: boolean
  platforms: Platform[]
  posts: Record<Platform, string>
}

const platformConfigs: Record<Platform, PlatformConfig> = {
  linkedin: { name: 'LinkedIn', color: 'bg-blue-600', maxLength: 3000, icon: '💼' },
  instagram: { name: 'Instagram', color: 'bg-pink-600', maxLength: 2200, icon: '📸' },
  twitter: { name: 'X (Twitter)', color: 'bg-black', maxLength: 280, icon: '🐦' },
  facebook: { name: 'Facebook', color: 'bg-blue-700', maxLength: 63206, icon: '👥' }
}

function App() {
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useKV<Platform[]>('selected-platforms', [])
  const [generatedPosts, setGeneratedPosts] = useState<Record<Platform, string>>({} as Record<Platform, string>)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [savedGenerations, setSavedGenerations] = useKV<SavedGeneration[]>('saved-generations', [])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('generate')

  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api'

  const handlePlatformToggle = (platform: Platform, checked: boolean) => {
    if (checked) {
      setSelectedPlatforms(prev => [...prev, platform])
    } else {
      setSelectedPlatforms(prev => prev.filter(p => p !== platform))
    }
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const extractContentFromUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch(`${apiBaseUrl}/extract-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error(`Failed to extract content: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success && result.extractedContent) {
        return result.extractedContent
      } else {
        throw new Error(result.error || 'Failed to extract content')
      }
    } catch (error) {
      console.error('URL extraction error:', error)
      // Fallback to simple URL description
      return `Content from ${url}: This content will be analyzed and transformed for social media.`
    }
  }

  const generatePosts = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) return

    setIsGenerating(true)
    setError('')
    
    try {
      let contentToProcess = content
      const isUrl = isValidUrl(content.trim())

      // Check if content is a URL and extract content
      if (isUrl) {
        contentToProcess = await extractContentFromUrl(content.trim())
      }

      // Call Azure Functions chat API with correct payload format
      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: contentToProcess,
          platforms: selectedPlatforms,
          isUrl
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate posts: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error('Failed to generate posts')
      }

      setGeneratedPosts(result.posts)

      // Save the generation to history
      const newGeneration: SavedGeneration = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        content: content.trim(),
        isUrl,
        platforms: [...selectedPlatforms],
        posts: result.posts
      }

      setSavedGenerations(prev => [newGeneration, ...prev])
      toast.success('Posts generated and saved to history!')
      
    } catch (err) {
      setError('Failed to generate posts. Please try again.')
      console.error('Generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${platform} post copied to clipboard!`)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const loadGeneration = (generation: SavedGeneration) => {
    setContent(generation.content)
    setSelectedPlatforms(generation.platforms)
    setGeneratedPosts(generation.posts)
    setActiveTab('generate')
    toast.success('Generation loaded!')
  }

  const deleteGeneration = (id: string) => {
    setSavedGenerations(prev => prev.filter(gen => gen.id !== id))
    toast.success('Generation deleted')
  }

  const clearAllHistory = () => {
    setSavedGenerations([])
    toast.success('All history cleared')
  }

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(timestamp))
  }

  const filteredGenerations = (savedGenerations || []).filter(gen => {
    // Ensure gen and its properties exist before filtering
    if (!gen || !gen.content || !gen.platforms) {
      return false;
    }
    
    // Ensure searchTerm is a string
    const normalizedSearchTerm = (searchTerm || '').toLowerCase();
    
    return (
      gen.content.toLowerCase().includes(normalizedSearchTerm) ||
      gen.platforms.some(p => {
        // Ensure platform exists in config before accessing name
        const platformConfig = platformConfigs[p];
        return platformConfig && platformConfig.name.toLowerCase().includes(normalizedSearchTerm);
      })
    );
  })

  const canGenerate = content.trim().length > 0 && selectedPlatforms.length > 0

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <Zap className="text-accent" size={32} />
            Social Media Post Generator
          </h1>
          <p className="text-muted-foreground">
            Transform any content into platform-optimized social media posts powered by Azure AI
          </p>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Zap size={16} />
              Generate Posts
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History size={16} />
              History ({savedGenerations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6 mt-6">
            {/* Content Input */}
            <Card>
              <CardHeader>
                <CardTitle>Input Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Enter your content, paragraph, or paste a website URL..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-32 resize-none"
                    id="content-input"
                  />
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>
                      {isValidUrl(content.trim()) ? '🔗 URL detected' : '📝 Text content'}
                    </span>
                    <span>{content.length} characters</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(Object.keys(platformConfigs) as Platform[]).map((platform) => {
                    const config = platformConfigs[platform]
                    const isSelected = selectedPlatforms.includes(platform)
                    
                    return (
                      <div
                        key={platform}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                          isSelected ? 'bg-secondary border-primary' : 'border-border hover:bg-muted'
                        }`}
                      >
                        <Checkbox
                          id={platform}
                          checked={isSelected}
                          onCheckedChange={(checked) => handlePlatformToggle(platform, checked as boolean)}
                        />
                        <label
                          htmlFor={platform}
                          className="flex items-center space-x-2 text-sm font-medium cursor-pointer flex-1"
                        >
                          <span className="text-lg">{config.icon}</span>
                          <span>{config.name}</span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-center">
              <Button
                onClick={generatePosts}
                disabled={!canGenerate || isGenerating}
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Generating Posts...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2" size={20} />
                    Generate Posts
                  </>
                )}
              </Button>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle size={16} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generated Posts */}
            {Object.keys(generatedPosts).length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-center">Generated Posts</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedPlatforms.map((platform) => {
                    const config = platformConfigs[platform]
                    const post = generatedPosts[platform]
                    
                    if (!post) return null

                    const isOverLimit = post.length > config.maxLength
                    
                    return (
                      <Card key={platform} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <span className="text-xl">{config.icon}</span>
                              {config.name}
                            </CardTitle>
                            <Badge 
                              variant={isOverLimit ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {post.length}/{config.maxLength}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="bg-muted p-3 rounded-md text-sm leading-relaxed whitespace-pre-wrap">
                            {post}
                          </div>
                          <Button
                            onClick={() => copyToClipboard(post, config.name)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Copy className="mr-2" size={16} />
                            Copy to Clipboard
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            {/* History Controls */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History size={20} />
                    Generation History
                  </CardTitle>
                  {savedGenerations.length > 0 && (
                    <Button
                      onClick={clearAllHistory}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="mr-2" size={16} />
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Search size={16} className="text-muted-foreground" />
                  <Input
                    placeholder="Search by content or platform..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* History List */}
            {filteredGenerations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <History size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {savedGenerations.length === 0 ? 'No history yet' : 'No matching results'}
                  </h3>
                  <p className="text-muted-foreground">
                    {savedGenerations.length === 0 
                      ? 'Generate your first social media posts to see them here'
                      : 'Try adjusting your search terms'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {filteredGenerations.map((generation) => (
                      <Card key={generation.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar size={14} />
                                {formatDate(generation.timestamp)}
                                {generation.isUrl && (
                                  <Badge variant="outline" className="text-xs">
                                    URL
                                  </Badge>
                                )}
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {generation.platforms.map((platform) => (
                                  <Badge key={platform} variant="secondary" className="text-xs">
                                    {platformConfigs[platform].icon} {platformConfigs[platform].name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => loadGeneration(generation)}
                                variant="outline"
                                size="sm"
                              >
                                Load
                              </Button>
                              <Button
                                onClick={() => deleteGeneration(generation.id)}
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="bg-muted p-3 rounded-md">
                            <p className="text-sm font-medium mb-2">Original Content:</p>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {generation.content}
                            </p>
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-3">
                            <p className="text-sm font-medium">Generated Posts:</p>
                            <div className="grid gap-3 md:grid-cols-2">
                              {generation.platforms.map((platform) => {
                                const config = platformConfigs[platform]
                                const post = generation.posts[platform]
                                
                                return (
                                  <div key={platform} className="border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">{config.icon}</span>
                                        <span className="text-sm font-medium">{config.name}</span>
                                      </div>
                                      <Button
                                        onClick={() => copyToClipboard(post, config.name)}
                                        variant="ghost"
                                        size="sm"
                                      >
                                        <Copy size={14} />
                                      </Button>
                                    </div>
                                    <div className="bg-muted p-2 rounded text-xs max-h-20 overflow-y-auto">
                                      {post}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App