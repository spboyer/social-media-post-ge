import React, { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, CheckCircle, AlertCircle, Sparkles } from '@phosphor-icons/react'
import { toast } from 'sonner'

type Platform = 'linkedin' | 'instagram' | 'twitter' | 'facebook'

interface PlatformConfig {
  name: string
  color: string
  maxLength: number
  icon: string
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
  const [generatedPosts, setGeneratedPosts] = useState<Record<Platform, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')

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
    // For demo purposes, we'll simulate URL content extraction
    // In a real app, you might use a service to extract page content
    return `Content from ${url}: This is extracted content that would come from the webpage.`
  }

  const generatePosts = async () => {
    if (!content.trim() || selectedPlatforms.length === 0) return

    setIsGenerating(true)
    setError('')
    
    try {
      let contentToProcess = content

      // Check if content is a URL and extract content
      if (isValidUrl(content.trim())) {
        contentToProcess = await extractContentFromUrl(content.trim())
      }

      const posts: Record<Platform, string> = {}

      for (const platform of selectedPlatforms) {
        const config = platformConfigs[platform]
        
        const prompt = spark.llmPrompt`You are a social media expert. Transform the following content into an engaging ${config.name} post that follows the platform's best practices and stays within ${config.maxLength} characters.

Content: ${contentToProcess}

Platform: ${config.name}
Character limit: ${config.maxLength}

Requirements:
- Make it engaging and platform-appropriate
- Use relevant hashtags for ${config.name}
- Match the tone and style typical for ${config.name}
- Stay within the character limit
- For LinkedIn: Professional tone, industry insights, thought leadership
- For Instagram: Visual storytelling, lifestyle focused, emoji-friendly
- For X (Twitter): Concise, conversational, trending topics
- For Facebook: Community-focused, discussion-starting, personal connection

Return only the post content, no explanations.`

        const result = await spark.llm(prompt)
        posts[platform] = result.trim()
      }

      setGeneratedPosts(posts)
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

  const canGenerate = content.trim().length > 0 && selectedPlatforms.length > 0

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <Sparkles className="text-accent" size={32} />
            Social Media Post Generator
          </h1>
          <p className="text-muted-foreground">
            Transform any content into platform-optimized social media posts
          </p>
        </div>

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
                <Sparkles className="mr-2" size={20} />
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
      </div>
    </div>
  )
}

export default App