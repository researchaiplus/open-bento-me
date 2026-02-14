"use client"

import { LinkCard } from './link-card'
import { TextCard } from './text-card'
import { ImageCard } from './image-card'
import { RepositoryCard } from './repository-card'
import { PeopleCardDemo } from './people-card'
import { SectionTitleCard } from './sectiontitle-card'
import { NeedBoardCard } from './needboard-card'
import type { BentoItemProps } from './types'

export function BentoItem(props: BentoItemProps) {

  if (props.type === 'link' && props.url) {
    const linkProps = {
      url: props.url,
      onDelete: props.onDelete,
      isEditable: props.isDraggable,
      savedTitle: props.savedTitle,
      size: props.cardSize,
      onSizeChange: props.onSizeChange,
      savedImage: props.savedImage || undefined,
      onImageChange: props.onImageChange ? 
        (newImage: string | null) => props.onImageChange!(newImage ?? undefined) : 
        undefined,
      isResizable: true, // 启用尺寸调整功能
    }
    return <LinkCard {...linkProps} />
  }
  
  if (props.type === 'text') {
    return <TextCard 
      text={props.text}
      size={props.cardSize}
      isEditable={props.isDraggable}
      onDelete={props.onDelete}
      onTextChange={props.onTextChange}
      onSizeChange={props.onSizeChange}
      isResizable={false}
    />
  }

  if (props.type === 'image' && props.imageUrl) {
    return <ImageCard
      itemId={props.id}
      imageUrl={props.imageUrl}
      size={props.cardSize}
      isEditable={props.isDraggable}
      onDelete={props.onDelete}
      onImageChange={props.onImageChange}
      onSizeChange={props.onSizeChange}
      isResizable={false}
    />
  }

  if (props.type === 'github' && props.owner && props.repo) {
    return <RepositoryCard
      platform={props.platform || 'github'}
      owner={props.owner}
      repository={props.repo}
      description={props.savedDescription || props.description || ''}
      language={props.language}
      languageColor={props.languageColor || '#000000'}
      category={props.platform === 'huggingface' ? (props.category || '') : undefined}
      stars={props.stars || 0}
      downloads={props.platform === 'huggingface' ? props.downloads : undefined}
      likes={props.platform === 'huggingface' ? props.likes : undefined}
      isEditable={props.isDraggable}
      isResizable={true} // 启用尺寸调整功能
      size={props.cardSize}
      onSizeChange={props.onSizeChange}
      onDescriptionChange={props.onDescriptionChange}
      onDelete={props.onDelete}
    />
  }

  // if (props.type === 'github' && props.owner && props.repo) {
  //   return <GithubCard
  //     owner={props.owner}
  //     repo={props.repo}
  //     description={props.savedDescription || ''}
  //     language={props.language || ''}
  //     languageColor={props.languageColor || '#000000'}
  //     stars={props.stars || 0}
  //     topics={props.topics || []}
  //     isEditable={props.isDraggable}
  //     onDelete={props.onDelete}
  //     isResizable={false}
  //   />
  // }

  if (props.type === 'people' && props.user) {
    return (
      <PeopleCardDemo
        user={props.user}
        isEditable={props.isDraggable}
        onDelete={props.onDelete}
        isResizable={false}
      />
    )
  }

  // 不检查 text 是否为空，允许用户清空后继续编辑（组件内部会显示占位符）
  if (props.type === 'section_title') {
    return (
      <SectionTitleCard
        text={props.text}
        isEditable={props.isDraggable}
        onDelete={props.onDelete}
        onTextChange={props.onTextChange}
      />
    )
  }

  // need type
  if (props.type === 'need') {
    return (
      <NeedBoardCard
        title="Need Board"
        content={props.content || ''}
        isEditable={props.isDraggable}
        onDelete={props.onDelete}
        onContentChange={props.onContentChange}
      />
    )
  }

  return <div>{props.content}</div>
} 
