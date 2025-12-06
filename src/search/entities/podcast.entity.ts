import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Episode } from './episode.entity';

@Entity()
export class Podcast {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: true })
  itunesId: string;

  @Column()
  title: string;

  @Column()
  artist: string;

  @Column({ nullable: true })
  image: string;

  @Column()
  collectionViewUrl: string;

  @OneToMany(() => Episode, (episode) => episode.podcast, { cascade: true })
  episodes: Episode[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
